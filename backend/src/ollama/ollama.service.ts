import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama, type Tool } from 'ollama';
import { PropertiesService } from 'src/properties/properties.service';
import type { PropertyFilters } from 'src/properties/dto/filter-property.dto';

export const PROPERTY_SYSTEM = `Eres un asistente experto en inmuebles y compra/venta de viviendas.
- Respondes siempre en español, de forma breve y clara.
- Solo hablas de vivienda, alquiler, compra, precio, ciudad, habitaciones, baños, tipo de propiedad y filtros de búsqueda.
- Si te preguntan otra cosa, di amablemente que solo puedes ayudar con propiedades inmobiliarias.
- Nunca des precios, direcciones, disponibilidad ni características de propiedades concretas. Esos datos solo los proporciona el sistema de búsqueda.
- Si no tienes un dato, dilo claramente y no lo inventes.
- Si el usuario no ha dado ciudad, tipo o presupuesto, pregúntalo en lugar de suponerlo.
`;

const EXTRACT_SYSTEM = `Extrae filtros de búsqueda inmobiliaria del mensaje del usuario.
- Devuelve solo JSON que cumpla el esquema.
- Si el usuario no menciona un dato, omite ese campo. No inventes valores.
- type: HOUSE para casa, chalet o villa. APARTMENT para piso o apartamento.
- operation: RENT para alquiler, SALE para compra o venta.
- status: NEW para obra nueva, USED para segunda mano, TO_RENOVATE para a reformar.
- Los precios están en euros y son números sin separadores (200000, no 200.000).
- city es solo el nombre de la ciudad, sin artículos ni otras palabras.`;

const ANSWER_SYSTEM = `Eres un asistente inmobiliario. Responde en español, breve y claro.
- Usa EXCLUSIVAMENTE los datos de <resultados>. No añadas información que no esté ahí.
- Si te preguntan algo que no aparece en los datos, di que no dispones de ese dato.
- No inventes precios, direcciones ni características.
- Resume los resultados en pocas líneas y menciona los más relevantes.`;

const FILTERS_SCHEMA = {
  type: 'object',
  properties: {
    city: { type: 'string' },
    type: { type: 'string', enum: ['HOUSE', 'APARTMENT'] },
    operation: { type: 'string', enum: ['RENT', 'SALE'] },
    rooms: { type: 'integer' },
    bathrooms: { type: 'integer' },
    minPrice: { type: 'number' },
    maxPrice: { type: 'number' },
    status: { type: 'string', enum: ['NEW', 'USED', 'TO_RENOVATE'] },
  },
} as const;

// Campos de cada propiedad que se envían al modelo (solo los que existan)
const PROPERTY_PROMPT_FIELDS = [
  'title',
  'type',
  'operation',
  'status',
  'city',
  'price',
  'rooms',
  'bathrooms',
  'area',
  'description',
];

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly client: Ollama;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly propertiesService: PropertiesService,
  ) {
    const baseUrl = this.normalizeHost(
      this.configService.get<string>('OLLAMA_BASE_URL') ?? 'http://127.0.0.1',
    );
    const port = this.configService.get<string>('OLLAMA_PORT') ?? ':11434';
    this.model = this.resolveModel(
      this.configService.get<string>('OLLAMA_MODEL') ?? 'llama3.1:8b',
    );

    this.client = new Ollama({
      host: `${baseUrl}${port}`,
    });

    this.logger.debug(
      `Ollama configured for host ${baseUrl}${port} and model ${this.model}`,
    );
  }

  async ask(
    question: string,
    system: string = PROPERTY_SYSTEM,
    temperature = 0.0,
    format?: string | object | null,
  ): Promise<string> {
    if (!question) {
      throw new BadRequestException('Question is not defined');
    }

    if (temperature < 0 || temperature > 2) {
      throw new BadRequestException('Temperature must be between 0 and 2');
    }

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (system) {
      messages.push({ role: 'system', content: system });
    }

    messages.push({ role: 'user', content: question });

    const response = await this.client.chat({
      model: this.model,
      messages,
      format: format ?? undefined,
      options: { temperature, seed: 42 },
    });

    return response.message.content ?? '';
  }

  async askWithTools(
    question: string,
    tools: Tool[],
    system: string = PROPERTY_SYSTEM,
    temperature = 0.0,
  ): Promise<
    [string, Array<{ name: string; arguments: Record<string, any> }>]
  > {
    if (!question) {
      throw new BadRequestException('Question is not defined');
    }

    if (temperature < 0 || temperature > 2) {
      throw new BadRequestException('Temperature must be between 0 and 2');
    }

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (system) {
      messages.push({ role: 'system', content: system });
    }

    messages.push({ role: 'user', content: question });

    const response = await this.client.chat({
      model: this.model,
      messages,
      tools,
      options: { temperature, seed: 42 },
    });

    const message = response.message;
    const calls = (message.tool_calls ?? []).map((toolCall: any) => ({
      name: toolCall.function?.name ?? '',
      arguments: this.parseToolArguments(toolCall.function?.arguments),
    }));

    return [message.content ?? '', calls];
  }

  async searchPropertiesByQuestion(question: string): Promise<{
    answer: string;
    filters: PropertyFilters;
    properties: any[];
  }> {
    if (!question) {
      throw new BadRequestException('Question is not defined');
    }

    const filters = await this.extractFilters(question);

    // Sin filtros útiles: pedimos más datos en lugar de buscar a ciegas
    if (Object.keys(filters).length === 0) {
      return {
        answer:
          'Claro, puedo ayudarte a buscar una vivienda. Dime la ciudad, si quieres casa o piso, el presupuesto máximo y cuántas habitaciones necesitas.',
        filters,
        properties: [],
      };
    }

    const properties = await this.propertiesService.findAllFiltered(filters);
    const summary = this.summarizeFilters(filters);

    // Sin resultados: plantilla fija, sin llamar al modelo (cero riesgo de invento)
    if (properties.length === 0) {
      return {
        answer: `No he encontrado viviendas para ${summary || 'los criterios indicados'}. Prueba a ampliar el presupuesto o a cambiar la ciudad.`,
        filters,
        properties: [],
      };
    }

    const topProperties = properties.slice(0, 5);
    const answer = await this.answerFromProperties(
      question,
      filters,
      topProperties,
      properties.length,
      summary,
    );

    return { answer, filters, properties: topProperties };
  }

  // ---------------------------------------------------------------------------
  // Extracción de filtros
  // ---------------------------------------------------------------------------

  private async extractFilters(question: string): Promise<PropertyFilters> {
    return this.parsePropertyFilters(question);
  }

  private sanitizeFilters(raw: Record<string, any>): PropertyFilters {
    const positive = (value: unknown): number | undefined => {
      const num = Number(value);
      return Number.isFinite(num) && num > 0 ? num : undefined;
    };

    const oneOf = <T extends string>(
      value: unknown,
      allowed: readonly T[],
    ): T | undefined =>
      allowed.includes(value as T) ? (value as T) : undefined;

    const candidate = {
      city:
        typeof raw?.city === 'string' && raw.city.trim()
          ? raw.city.trim()
          : undefined,
      type: oneOf(raw?.type, ['HOUSE', 'APARTMENT'] as const),
      operation: oneOf(raw?.operation, ['RENT', 'SALE'] as const),
      status: oneOf(raw?.status, ['NEW', 'USED', 'TO_RENOVATE'] as const),
      rooms: positive(raw?.rooms),
      bathrooms: positive(raw?.bathrooms),
      minPrice: positive(raw?.minPrice),
      maxPrice: positive(raw?.maxPrice),
    };

    // Si el rango es incoherente, se descarta el mínimo
    if (
      candidate.minPrice !== undefined &&
      candidate.maxPrice !== undefined &&
      candidate.minPrice > candidate.maxPrice
    ) {
      candidate.minPrice = undefined;
    }

    // Quitamos los undefined para que findAllFiltered no reciba claves vacías
    return Object.fromEntries(
      Object.entries(candidate).filter(([, value]) => value !== undefined),
    ) as PropertyFilters;
  }

  // ---------------------------------------------------------------------------
  // Respuesta basada solo en datos reales
  // ---------------------------------------------------------------------------

  private async answerFromProperties(
    question: string,
    filters: PropertyFilters,
    properties: any[],
    totalFound: number,
    summary: string,
  ): Promise<string> {
    const fallback = `He encontrado ${totalFound} viviendas que encajan con ${summary || 'tu búsqueda'}.`;

    try {
      const context = properties.map((property) =>
        this.toPromptProperty(property),
      );

      const prompt = `<filtros>${JSON.stringify(filters)}</filtros>
<total_encontradas>${totalFound}</total_encontradas>
<resultados>${JSON.stringify(context)}</resultados>
Pregunta del usuario: ${question}`;

      const answer = await this.ask(prompt, ANSWER_SYSTEM, 0);
      return answer.trim() || fallback;
    } catch (error) {
      this.logger.warn(
        `LLM answer failed, using template: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return fallback;
    }
  }

  private toPromptProperty(property: any): Record<string, any> {
    const plain =
      property && typeof property.toJSON === 'function'
        ? property.toJSON()
        : property;

    return Object.fromEntries(
      PROPERTY_PROMPT_FIELDS.filter(
        (field) => plain?.[field] !== undefined && plain?.[field] !== null,
      ).map((field) => [field, plain[field]]),
    );
  }

  private summarizeFilters(filters: PropertyFilters): string {
    return [
      filters.city && `ciudad: ${filters.city}`,
      filters.type && `tipo: ${filters.type}`,
      filters.operation && `operación: ${filters.operation}`,
      filters.rooms && `habitaciones: ${filters.rooms}`,
      filters.bathrooms && `baños: ${filters.bathrooms}`,
      filters.minPrice && `precio desde: ${filters.minPrice}`,
      filters.maxPrice && `precio hasta: ${filters.maxPrice}`,
    ]
      .filter(Boolean)
      .join(', ');
  }

  // ---------------------------------------------------------------------------
  // Respaldo con regex (se usa solo si falla el LLM)
  // ---------------------------------------------------------------------------

  private parsePropertyFilters(question: string): PropertyFilters {
    const text = question.toLowerCase();
    const compact = this.removeDiacritics(text);
    const filters: PropertyFilters = {};

    const cityNames = [
      'madrid',
      'barcelona',
      'valencia',
      'sevilla',
      'malaga',
      'bilbao',
      'zaragoza',
      'alicante',
      'granada',
      'murcia',
      'palma',
      'valladolid',
      'vigo',
      'gijon',
      'cordoba',
      'san sebastian',
      'toledo',
      'salamanca',
      'santander',
      'cadiz',
      'tombuctu',
    ];

    const foundCity = cityNames.find((city) => {
      const pattern = new RegExp(`\\b${this.escapeRegExp(city)}\\b`, 'i');
      return pattern.test(question) || pattern.test(compact);
    });
    if (foundCity) {
      filters.city =
        foundCity === 'tombuctu' ? 'Tombuctú' : this.titleCaseCity(foundCity);
    }

    const explicitCity = text.match(
      /(?:en|de|por|para|a)\s+([a-záéíóúüñ]+(?:\s+[a-záéíóúüñ]+)*?)(?=\s+(?:con|y|para|desde|hasta|máximo|maximo|menos|precio|habitaciones|baños|alquiler|venta|compra|casa|piso|apartamento|chalet|villa)|\s*[.,;?!]?\s*$)/i,
    );
    if (!filters.city && explicitCity) {
      const city = this.cleanupCityName(explicitCity[1]);
      if (city) filters.city = city;
    }

    const cityFallback = text.match(
      /\b(?:ciudad|localidad)\s+(?:es|de)?\s*([a-záéíóúüñ]+(?:\s+[a-záéíóúüñ]+)*)/i,
    );
    if (!filters.city && cityFallback) {
      const city = this.cleanupCityName(cityFallback[1]);
      if (city) filters.city = city;
    }

    if (
      /casa|chalet|villa|casa de campo/.test(compact) &&
      !/piso|apartamento|flat/.test(compact)
    ) {
      filters.type = 'HOUSE';
    }
    if (/piso|apartamento|flat/.test(compact)) {
      filters.type = 'APARTMENT';
    }

    const buyTerms = /venta|comprar|compra|adquirir|vender/;
    const rentTerms = /alquiler|renta|rentar|arrendar/;
    if (buyTerms.test(compact) && !rentTerms.test(compact)) {
      filters.operation = 'SALE';
    }
    if (rentTerms.test(compact) && !buyTerms.test(compact)) {
      filters.operation = 'RENT';
    }

    const roomsMatch = text.match(/(\d+)\s*habitaciones?/i);
    if (roomsMatch) filters.rooms = Number(roomsMatch[1]);

    const bathroomsMatch = text.match(/(\d+)\s*baños?/i);
    if (bathroomsMatch) filters.bathrooms = Number(bathroomsMatch[1]);

    const minPriceMatch = text.match(
      /(?:desde|a partir de|partir de)\s*([0-9.,]+)\s*(?:euros?|€|eur)/i,
    );
    if (minPriceMatch) {
      filters.minPrice = this.parsePriceValue(minPriceMatch[1]);
    }

    const maxPriceMatch = text.match(
      /(?:hasta|máximo|maximo|menos\s+de|por\s+debajo\s+de|debajo\s+de|bajo|por\s+menos\s+de)\s*([0-9.,]+)\s*(?:euros?|€|eur)?/i,
    );
    if (maxPriceMatch) {
      filters.maxPrice = this.parsePriceValue(maxPriceMatch[1]);
    }

    const betweenMatch = text.match(
      /entre\s*([0-9.]+)\s*(?:euros?|€|eur)\s*y\s*([0-9.]+)/i,
    );
    if (betweenMatch) {
      filters.minPrice = this.parsePriceValue(betweenMatch[1]);
      filters.maxPrice = this.parsePriceValue(betweenMatch[2]);
    }

    if (/obra nueva|nuevo/.test(compact)) filters.status = 'NEW';
    if (/reformar|a reformar|viejo|antigua/.test(compact))
      filters.status = 'TO_RENOVATE';
    if (/usado|segunda mano/.test(compact)) filters.status = 'USED';

    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      filters.minPrice = undefined;
    }

    return filters;
  }

  private parsePriceValue(value: string): number {
    const cleaned = value
      .replace(/\s+/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(/,/g, '');

    return Number(cleaned);
  }

  private removeDiacritics(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private cleanupCityName(value: string): string | undefined {
    const cleaned = value.trim().replace(/^[\s,.;:]+|[\s,.;:]+$/g, '');
    return cleaned
      ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      : undefined;
  }

  private titleCaseCity(value: string): string {
    return value
      .split(' ')
      .map((part) =>
        part
          ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          : part,
      )
      .join(' ');
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ---------------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------------

  private parseToolArguments(value: unknown): Record<string, any> {
    if (!value) {
      return {};
    }

    if (typeof value === 'object') {
      return value as Record<string, any>;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed ? parsed : {};
      } catch {
        return {};
      }
    }

    return {};
  }

  private normalizeHost(value: string): string {
    return value
      .replace('http://localhost', 'http://127.0.0.1')
      .replace('https://localhost', 'https://127.0.0.1')
      .replace('http://[::1]', 'http://127.0.0.1')
      .replace('https://[::1]', 'https://127.0.0.1');
  }

  private resolveModel(value: string): string {
    if (!value || value.trim() === '') {
      return 'llama3.1:8b';
    }

    const normalized = value.trim();
    if (normalized === 'llama3.1') {
      return 'llama3.1:8b';
    }

    return normalized;
  }
}

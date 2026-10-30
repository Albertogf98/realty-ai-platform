import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama, type Tool } from 'ollama';
import {
  propertyFiltersSchema,
  type PropertyFilters,
} from 'src/properties/dto/filter-property.dto';
import { PropertiesService } from 'src/properties/properties.service';
import { ANSWER_SYSTEM, EXTRACT_SYSTEM, PROPERTY_SYSTEM } from './prompts';

export { PROPERTY_SYSTEM } from './prompts';

// Campos de cada propiedad que se envían al modelo (solo los que existan)
// Mapeo de campos reales de Prisma -> nombre legible para el LLM
const PROPERTY_PROMPT_FIELD_MAP: Array<[string, string]> = [
  ['id', 'id'],
  ['title_es', 'title'],
  ['title_en', 'title_en'],
  ['description_es', 'description'],
  ['description_en', 'description_en'],
  ['type', 'type'],
  ['operation', 'operation'],
  ['status', 'status'],
  ['city', 'city'],
  ['state', 'state'],
  ['price', 'price'],
  ['rooms', 'rooms'],
  ['bathrooms', 'bathrooms'],
  ['sqm', 'area'],
  ['parking', 'parking'],
  ['garden', 'garden'],
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
    const baseUrl =
      this.configService.get<string>('OLLAMA_BASE_URL') ?? 'http://127.0.0.1';
    const port = this.configService.get<string>('OLLAMA_PORT') ?? ':11434';
    const host = this.buildOllamaOrigin(baseUrl, port);

    this.model = this.resolveModel(
      this.configService.get<string>('OLLAMA_MODEL') ?? 'llama3.1:8b',
    );

    this.client = new Ollama({
      host,
    });

    this.logger.debug(
      `Ollama configured for host ${host} and model ${this.model}`,
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

  async searchPropertiesByQuestion(
    question: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<{
    answer: string;
    filters: PropertyFilters;
    properties: any[];
  }> {
    if (!question) {
      throw new BadRequestException('Question is not defined');
    }

    const questionWithContext = this.buildQuestionWithContext(
      question,
      history,
    );

    const filters = await this.extractFilters(questionWithContext);

    // Sin filtros útiles: pedimos más datos en lugar de buscar a ciegas
    if (Object.keys(filters).length === 0) {
      return {
        answer:
          '¡Con gusto te ayudo a encontrar tu próxima vivienda! Cuéntame un poco más: ¿en qué ciudad te interesa, prefieres casa o piso, y qué presupuesto tienes en mente?',
        filters,
        properties: [],
      };
    }

    const properties = await this.propertiesService.findAllFiltered(filters);
    const summary = this.summarizeFilters(filters);

    // Sin resultados: plantilla fija, sin llamar al modelo (cero riesgo de invento)
    if (properties.length === 0) {
      const availableCities = await this.propertiesService
        .findAvailableCities()
        .catch(() => [] as string[]);

      const citiesHint = availableCities.length
        ? ` Ahora mismo tengo viviendas en: ${this.formatCityList(availableCities)}.`
        : '';

      return {
        answer: `Lo siento, ahora mismo no tengo viviendas disponibles que encajen con lo que buscas.${citiesHint} ¿Quieres que mire en alguna de esas ciudades o ajustamos el presupuesto o las habitaciones?`,
        filters,
        properties: [],
      };
    }

    const topProperties = properties.slice(0, 5);
    const answer = await this.answerFromProperties(
      questionWithContext,
      filters,
      topProperties,
      properties.length,
      summary,
    );

    return { answer, filters, properties: topProperties };
  }

  private buildQuestionWithContext(
    question: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): string {
    if (!history.length) {
      return question;
    }

    const recentHistory = history.slice(-6);
    const transcript = recentHistory
      .map(
        (entry) =>
          `${entry.role === 'user' ? 'Usuario' : 'Asistente'}: ${entry.content}`,
      )
      .join('\n');

    return `<historial_conversacion>\n${transcript}\n</historial_conversacion>\nPregunta actual: ${question}`;
  }

  private async extractFilters(question: string): Promise<PropertyFilters> {
    try {
      const formattedFilters = this.buildPropertyFiltersJsonSchema();
      const rawResponse = await this.ask(
        question,
        EXTRACT_SYSTEM,
        0,
        formattedFilters,
      );
      const extracted = this.parseStructuredFilters(rawResponse);

      if (!extracted) {
        throw new Error('Message content is empty or not valid JSON');
      }

      const validated = propertyFiltersSchema.safeParse(extracted);
      if (!validated.success) {
        throw new Error(
          validated.error.issues.map((issue) => issue.message).join('; '),
        );
      }

      return validated.data;
    } catch (error) {
      this.logger.warn(
        `LLM filter extraction failed, using regex fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.parsePropertyFilters(question);
    }
  }

  private parseStructuredFilters(
    value: string,
  ): Record<string, unknown> | undefined {
    const text = value.trim();
    if (!text) {
      return undefined;
    }

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      return undefined;
    }

    const jsonText = text.slice(start, end + 1);

    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  private buildPropertyFiltersJsonSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 1 },
        city: { type: 'string', minLength: 1 },
        type: { type: 'string', enum: ['HOUSE', 'APARTMENT'] },
        minPrice: { type: 'number' },
        maxPrice: { type: 'number' },
        rooms: { type: 'integer', minimum: 1 },
        bathrooms: { type: 'integer', minimum: 1 },
        status: { type: 'string', enum: ['NEW', 'USED', 'TO_RENOVATE'] },
        operation: { type: 'string', enum: ['SALE', 'RENT'] },
        page: { type: 'integer', minimum: 1 },
        pageSize: { type: 'integer', minimum: 1 },
      },
      additionalProperties: false,
    };
  }

  private sanitizeFilters(raw: Record<string, any>): PropertyFilters {
    const parsed = propertyFiltersSchema.safeParse(raw);

    if (!parsed.success) {
      return {} as PropertyFilters;
    }

    return Object.fromEntries(
      Object.entries(parsed.data).filter(([, value]) => value !== undefined),
    ) as PropertyFilters;
  }

  private async answerFromProperties(
    question: string,
    filters: PropertyFilters,
    properties: any[],
    totalFound: number,
    summary: string,
  ): Promise<string> {
    const fallback = `¡Buenas noticias! He encontrado ${totalFound} ${totalFound === 1 ? 'vivienda' : 'viviendas'} que encajan con lo que buscas. Estas son las más destacadas:`;

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
      PROPERTY_PROMPT_FIELD_MAP.filter(
        ([sourceField]) =>
          plain?.[sourceField] !== undefined && plain?.[sourceField] !== null,
      ).map(([sourceField, promptField]) => [promptField, plain[sourceField]]),
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

  /**
   * Formats a city list for user-facing messages, e.g.
   * "Fuengirola, Marbella y Málaga" (with "y" before the last item).
   */
  private formatCityList(cities: string[]): string {
    if (cities.length === 1) return cities[0];
    if (cities.length === 2) return cities.join(' y ');

    return `${cities.slice(0, -1).join(', ')} y ${cities[cities.length - 1]}`;
  }

  // ---------------------------------------------------------------------------
  // Respaldo con regex (se usa solo si falla el LLM)
  // ---------------------------------------------------------------------------

  private parsePropertyFilters(question: string): PropertyFilters {
    const text = question.toLowerCase();
    const compact = this.removeDiacritics(text);
    const filters: Record<string, any> = {};

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
      if (city) filters.city = this.resolveCityAlias(city);
    }

    const cityFallback = text.match(
      /\b(?:ciudad|localidad)\s+(?:es|de)?\s*([a-záéíóúüñ]+(?:\s+[a-záéíóúüñ]+)*)/i,
    );
    if (!filters.city && cityFallback) {
      const city = this.cleanupCityName(cityFallback[1]);
      if (city) filters.city = this.resolveCityAlias(city);
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

    const parsed = propertyFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return {} as PropertyFilters;
    }

    return Object.fromEntries(
      Object.entries(parsed.data).filter(([, value]) => value !== undefined),
    ) as PropertyFilters;
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

  private resolveCityAlias(value: string): string {
    const noDiacritics = this.removeDiacritics(value).trim();
    const normalized = noDiacritics.toLowerCase();

    const aliasMap: Record<string, string> = {
      fungirola: 'Fuengirola',
      fuengriola: 'Fuengirola',
      fuengirolo: 'Fuengirola',
      fuengirola: 'Fuengirola',
    };

    if (aliasMap[normalized]) {
      return aliasMap[normalized];
    }

    const cityNames = [
      'Fuengirola',
      'Marbella',
      'Málaga',
      'Malaga',
      'Madrid',
      'Barcelona',
      'Valencia',
      'Sevilla',
      'Bilbao',
      'Zaragoza',
      'Alicante',
      'Granada',
      'Murcia',
      'Palma',
      'Valladolid',
      'Vigo',
      'Gijon',
      'Cordoba',
      'Toledo',
      'Salamanca',
      'Santander',
      'Cadiz',
      'Tombuctú',
    ];

    const match = cityNames.find((city) => {
      const cityKey = this.removeDiacritics(city).toLowerCase();
      return (
        cityKey === normalized || this.levenshtein(normalized, cityKey) <= 2
      );
    });

    return match ?? value;
  }

  resolveCityVariants(value: string): string[] {
    const alias = this.resolveCityAlias(value);
    const normalized = this.removeDiacritics(value).trim().toLowerCase();

    const variants = [
      value,
      alias,
      this.cleanupCityName(value),
      this.titleCaseCity(value),
      normalized,
      this.removeDiacritics(alias),
    ].filter((item): item is string => Boolean(item));

    return Array.from(new Set(variants));
  }

  private levenshtein(a: string, b: string): number {
    const dp = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0),
    );

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    return dp[a.length][b.length];
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

  buildOllamaOrigin(baseUrl: string, port: string): string {
    const normalizedBase = this.normalizeHost(
      (baseUrl ?? 'http://127.0.0.1').trim(),
    )
      .replace(/\/+$/, '')
      .replace(/\/$/, '');
    const safePort = (port ?? ':11434').trim();
    const normalizedPort = safePort.startsWith(':') ? safePort : `:${safePort}`;

    if (this.hasExplicitPort(normalizedBase)) {
      return normalizedBase;
    }

    return `${normalizedBase}${normalizedPort}`;
  }

  private hasExplicitPort(value: string): boolean {
    return /:\d+(?:\/)?$/.test(value);
  }

  private normalizeHost(value: string): string {
    const trimmed = value.trim();
    const withoutProtocol = trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/\/$/, '');

    if (
      /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/i.test(withoutProtocol)
    ) {
      return 'http://127.0.0.1';
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
        .replace('http://localhost', 'http://127.0.0.1')
        .replace('https://localhost', 'https://127.0.0.1')
        .replace('http://[::1]', 'http://127.0.0.1')
        .replace('https://[::1]', 'https://127.0.0.1');
    }

    return `http://${withoutProtocol}`;
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

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyFilters } from './dto/filter-property.dto';
import { PropertiesRepository } from './properties.repository';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PropertiesService {
  constructor(
    private repo: PropertiesRepository,
    private cloudinaryService: CloudinaryService,
    private prisma: PrismaService,
  ) {}

  async create(data: CreatePropertyDto, files?: Express.Multer.File[]) {
    if (!files || files.length === 0)
      throw new BadRequestException('No images provided');

    const uploadedImages = await Promise.all(
      files.map((file) => this.cloudinaryService.uploadFile(file)),
    );

    const imagesData = uploadedImages.map((img: any) => ({
      url: img.url,
      public_id: img.public_id,
    }));

    const { agentId, ...rest } = data;

    const property = await this.repo.create({
      ...rest,
      price: Number(rest.price),
      rooms: Number(rest.rooms),
      bathrooms: Number(rest.bathrooms),
      sqm: Number(rest.sqm),
      parking: rest.parking === true,
      garden: rest.garden === true,
      agent: { connect: { id: agentId } },
      images: { create: imagesData },
    });

    return property;
  }

  async findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const property = await this.repo.findOne(id);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, data: any, files?: Express.Multer.File[]) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!property) throw new NotFoundException('Property not found');

    const {
      images: newImagesData,
      agent,
      buyer,
      createdAt,
      soldAt,
      ...rest
    } = data;

    let imagesUpdate: Array<{ url: string; public_id: string }> = [];

    // 1️⃣ Subir archivos nuevos
    if (files && files.length > 0) {
      try {
        const uploadedImages = await Promise.all(
          files.map((file) => this.cloudinaryService.uploadFile(file)),
        );
        imagesUpdate.push(...uploadedImages);
      } catch (err: any) {
        throw new InternalServerErrorException(
          `Error uploading images: ${err.message || ''}`,
        );
      }
    }

    // 2️⃣ Procesar imágenes existentes enviadas desde el front
    if (newImagesData && newImagesData.length > 0) {
      const imagesToKeepUrls = newImagesData.map((img: any) => img.url);

      // Borrar las imágenes que ya no se quieren
      const imagesToDelete = property.images.filter(
        (img) => !imagesToKeepUrls.includes(img.url),
      );

      for (const img of imagesToDelete) {
        if (img.public_id) {
          try {
            await this.cloudinaryService.deleteImage(img.public_id);
          } catch (err: any) {
            console.warn(
              `Failed to delete image ${img.public_id}: ${err.message}`,
            );
          }
        }
      }

      // Agregar las nuevas imágenes enviadas desde front que no existían
      imagesUpdate.push(
        ...newImagesData
          .filter((img: any) => !property.images.some((p) => p.url === img.url))
          .map((img: any) => ({ url: img.url, public_id: img.public_id })),
      );
    }

    // 3️⃣ Construir datos de actualización
    const updateData: any = {
      ...rest,
      agentId: agent?.id,
    };

    // 4️⃣ Manejar relación de imágenes
    if (imagesUpdate.length > 0) {
      // Hay imágenes → borrar las que no están y crear las nuevas
      updateData.images = {
        deleteMany: {
          url: { notIn: imagesUpdate.map((img) => img.url) },
        },
        create: imagesUpdate,
      };
    } else if (
      (files && files.length === 0) ||
      (newImagesData && newImagesData.length === 0)
    ) {
      // No hay imágenes → borrar todas las existentes
      updateData.images = {
        deleteMany: {},
      };
    }

    // 5️⃣ Ejecutar update en la base de datos
    const updatedProperty = await this.prisma.property.update({
      where: { id },
      data: updateData,
      include: { images: true },
    });

    return updatedProperty;
  }

  async remove(id: string) {
    const property = await this.repo.findOne(id);
    if (!property) throw new NotFoundException('Property not found');

    for (const img of property.images) {
      const publicId = (img as any).public_id;

      if (publicId)
        try {
          await this.cloudinaryService.deleteImage(publicId);
        } catch (error) {
          console.error(`Error deleting image ${publicId}:`, error);
        }
    }

    await Promise.all([
      this.repo.deleteManyMessages(id),
      this.repo.deleteManyFavorites(id),
      this.repo.deleteManyImages(id),
      this.repo.deleteManyAppointments(id),
    ]);

    return this.repo.delete(id);
  }

  async findAllFiltered(filters?: PropertyFilters) {
    const where: any = {};
    if (!filters) return this.repo.findAll();

    const hasMeaningfulFilters =
      !!filters.city ||
      !!filters.type ||
      !!filters.status ||
      !!filters.operation ||
      !!filters.rooms ||
      !!filters.bathrooms ||
      !!filters.minPrice ||
      !!filters.maxPrice;

    if (!hasMeaningfulFilters) {
      return [];
    }

    if (filters.city) {
      where.OR = this.buildCityWhereClauses(filters.city);
    }
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.operation) where.operation = filters.operation;
    // "con 3 habitaciones" = mínimo 3, no exactamente 3
    if (filters.rooms) where.rooms = { gte: Number(filters.rooms) };
    if (filters.bathrooms) where.bathrooms = { gte: Number(filters.bathrooms) };
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = Number(filters.minPrice);
      if (filters.maxPrice) where.price.lte = Number(filters.maxPrice);
    }

    return this.repo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { agent: true, images: true },
    });
  }

  async findAllPaginated(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;

    const [properties, total] = await Promise.all([
      this.repo.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { agent: true, buyer: true, images: true },
      }),
      this.repo.count(),
    ]);

    return { properties, total };
  }

  /**
   * Cities that actually have properties in the database (non-empty names).
   * Used to suggest alternatives when a search returns no results.
   */
  async findAvailableCities(): Promise<string[]> {
    const rows = await this.repo.findDistinctCities();

    return Array.from(
      new Set(
        rows
          .map(({ city }) => city?.trim())
          .filter((city): city is string => Boolean(city)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'es'));
  }

  async findAllFilteredAndPaginated(filters: PropertyFilters) {
    const { page = 1, pageSize = 10 } = filters;

    const hasMeaningfulFilters =
      !!filters.city ||
      !!filters.type ||
      !!filters.status ||
      !!filters.operation ||
      !!filters.rooms ||
      !!filters.bathrooms ||
      !!filters.minPrice ||
      !!filters.maxPrice ||
      !!(filters.title && filters.title.trim() !== '');

    if (!hasMeaningfulFilters) {
      return this.findAllPaginated(page, pageSize).then(
        ({ properties, total }) => ({
          data: properties,
          pagination: {
            page,
            pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
          },
        }),
      );
    }

    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.title != null && filters.title !== '') {
      where.OR = [
        { title_es: { contains: filters.title, mode: 'insensitive' } },
        { title_en: { contains: filters.title, mode: 'insensitive' } },
      ];
    }

    if (filters.city) {
      const cityFilters = this.buildCityWhereClauses(filters.city);

      if (where.OR) {
        where.OR = [...where.OR, ...cityFilters];
      } else {
        where.OR = cityFilters;
      }
    }
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.operation) where.operation = filters.operation;
    // "con 3 habitaciones" = mínimo 3, no exactamente 3
    if (filters.rooms) where.rooms = { gte: Number(filters.rooms) };
    if (filters.bathrooms) where.bathrooms = { gte: Number(filters.bathrooms) };
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = Number(filters.minPrice);
      if (filters.maxPrice) where.price.lte = Number(filters.maxPrice);
    }

    const [data, totalItems] = await Promise.all([
      this.repo.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { agent: true, images: true },
      }),
      this.repo.count(where),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  private resolveCityVariants(city: string): string[] {
    const aliases: Record<string, string> = {
      fungirola: 'Fuengirola',
      fuengriola: 'Fuengirola',
      fuengirolo: 'Fuengirola',
      fuengirola: 'Fuengirola',
    };

    const normalized = this.normalizeCity(city).toLowerCase();
    const canonical = aliases[normalized] ?? null;
    const variants = [
      city,
      canonical,
      this.removeDiacritics(city),
      this.normalizeCity(city),
      canonical ? this.removeDiacritics(canonical) : undefined,
      canonical ? this.normalizeCity(canonical) : undefined,
    ].filter((item): item is string => Boolean(item));

    return Array.from(new Set(variants));
  }

  /**
   * Builds Prisma `contains` conditions for a city.
   * Postgres `mode: 'insensitive'` does NOT fold diacritics, so a filter for
   * "Malaga" never matches rows stored as "Málaga". We generate both the
   * accented and unaccented forms of every variant so either spelling matches.
   */
  private buildCityWhereClauses(city: string): Array<{ city: { contains: string; mode: 'insensitive' } }> {
    const baseVariants = this.resolveCityVariants(city);
    const withAccents = baseVariants.map((variant) => this.addSpanishDiacritics(variant));

    return Array.from(new Set([...baseVariants, ...withAccents]))
      .filter(Boolean)
      .map((variant) => ({
        city: { contains: variant, mode: 'insensitive' as const },
      }));
  }

  /**
   * Restores common Spanish diacritics on a diacritics-free city name by
   * matching it against a small set of known Spanish city spellings.
   * Returns the input unchanged when no known accented form exists.
   */
  private addSpanishDiacritics(city: string): string {
    const normalized = this.normalizeCity(city).toLowerCase();
    if (!normalized) return city;

    const knownAccented: Record<string, string> = {
      malaga: 'Málaga',
      alicante: 'Alicante',
      cordoba: 'Córdoba',
      coruna: 'A Coruña',
      'a coruna': 'A Coruña',
      gijon: 'Gijón',
      leon: 'León',
      cadiz: 'Cádiz',
      'san sebastian': 'San Sebastián',
      avila: 'Ávila',
      aviles: 'Avilés',
      merida: 'Mérida',
      bilbao: 'Bilbao',
      toledo: 'Toledo',
      zaragoza: 'Zaragoza',
      sevilla: 'Sevilla',
      barcelona: 'Barcelona',
      madrid: 'Madrid',
      valencia: 'Valencia',
      murcia: 'Murcia',
      palma: 'Palma',
      valladolid: 'Valladolid',
      vigo: 'Vigo',
      salamanca: 'Salamanca',
      santander: 'Santander',
      granada: 'Granada',
      almeria: 'Almería',
      algeciras: 'Algeciras',
      estepona: 'Estepona',
      mijas: 'Mijas',
      marbella: 'Marbella',
      fuengirola: 'Fuengirola',
      torremolinos: 'Torremolinos',
      benalmadena: 'Benalmádena',
      alanis: 'Alanís',
      beires: 'Beires',
    };

    return knownAccented[normalized] ?? city;
  }

  private removeDiacritics(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private normalizeCity(value: string): string {
    return this.removeDiacritics(value).replace(/\s+/g, ' ').trim();
  }
}

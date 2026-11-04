import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyFilters } from './dto/filter-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
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

    const { agentId, ...rest } = data;
    const uploadedImages = await Promise.all(
      files.map((file) =>
        this.cloudinaryService.uploadFile(file, `realestate/${agentId}`),
      ),
    );

    const imagesData = uploadedImages.map((img) => ({
      url: img.url,
      public_id: img.public_id,
    }));

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

  async update(
    id: string,
    data: UpdatePropertyDto,
    actorId: string,
    files?: Express.Multer.File[],
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!property) throw new NotFoundException('Property not found');
    if (property.agentId !== actorId) {
      throw new ForbiddenException('You can only manage your own listings');
    }

    const { images: newImagesData, ...rest } = data;

    const imagesUpdate: Array<{ url: string; public_id: string }> = [];

    // 1️⃣ Subir archivos nuevos
    if (files && files.length > 0) {
      try {
        const uploadedImages = await Promise.all(
          files.map((file) =>
            this.cloudinaryService.uploadFile(file, `realestate/${actorId}`),
          ),
        );
        imagesUpdate.push(...uploadedImages);
      } catch (err: unknown) {
        throw new InternalServerErrorException(
          `Error uploading images: ${err instanceof Error ? err.message : ''}`,
        );
      }
    }

    // 2️⃣ Procesar imágenes existentes enviadas desde el front
    if (newImagesData) {
      const desiredUrls = new Set(newImagesData.map((img) => img.url));
      const imagesToDelete = property.images.filter(
        (img) => !desiredUrls.has(img.url),
      );

      for (const image of newImagesData) {
        const existingImage = property.images.find(
          (item) => item.url === image.url,
        );
        if (existingImage) continue;

        const expectedFolder = `realestate/${actorId}/`;
        const expectedCloudinaryPrefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
        if (
          !image.public_id?.startsWith(expectedFolder) ||
          !image.url.startsWith(expectedCloudinaryPrefix) ||
          !image.url.includes(image.public_id)
        ) {
          throw new BadRequestException(
            'New listing images must be uploaded to your account',
          );
        }

        imagesUpdate.push({ url: image.url, public_id: image.public_id });
      }

      for (const img of imagesToDelete) {
        if (!img.public_id) continue;
        try {
          await this.cloudinaryService.deleteImage(img.public_id);
        } catch (err: unknown) {
          console.warn(`Failed to delete image ${img.public_id}`, err);
        }
      }
    }

    // 3️⃣ Construir datos de actualización
    const updateData: Prisma.PropertyUpdateInput = { ...rest };

    // 4️⃣ Manejar relación de imágenes
    if (imagesUpdate.length > 0) {
      updateData.images = {
        deleteMany: {
          url: {
            notIn: [
              ...(newImagesData?.map((img) => img.url) ?? []),
              ...imagesUpdate.map((img) => img.url),
            ],
          },
        },
        create: imagesUpdate,
      };
    } else if (newImagesData) {
      updateData.images = {
        deleteMany:
          newImagesData.length === 0
            ? {}
            : { url: { notIn: newImagesData.map((img) => img.url) } },
      };
    }

    // 5️⃣ Ejecutar update en la base de datos
    return this.repo.update(id, updateData);
  }

  async remove(id: string, actorId: string) {
    const property = await this.repo.findOne(id);
    if (!property) throw new NotFoundException('Property not found');
    if (property.agentId !== actorId) {
      throw new ForbiddenException('You can only manage your own listings');
    }

    for (const img of property.images) {
      const publicId = img.public_id;

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
    const where: Prisma.PropertyWhereInput = {};
    if (!filters) return this.repo.findAll();
    const orFilters: Prisma.PropertyWhereInput[] = [];

    const hasMeaningfulFilters =
      !!filters.city ||
      !!filters.title ||
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
      orFilters.push(...this.buildCityWhereClauses(filters.city));
    }
    if (filters.title) {
      orFilters.push(
        { title_es: { contains: filters.title, mode: 'insensitive' } },
        { title_en: { contains: filters.title, mode: 'insensitive' } },
      );
    }
    if (orFilters.length > 0) where.OR = orFilters;
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
      include: {
        agent: { select: { id: true, name: true, role: true } },
        images: true,
      },
    });
  }

  async findAllPaginated(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;

    const [properties, total] = await Promise.all([
      this.repo.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { select: { id: true, name: true, role: true } },
          images: true,
        },
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
    const where: Prisma.PropertyWhereInput = {};
    const orFilters: Prisma.PropertyWhereInput[] = [];

    if (filters.title != null && filters.title !== '') {
      orFilters.push(
        { title_es: { contains: filters.title, mode: 'insensitive' } },
        { title_en: { contains: filters.title, mode: 'insensitive' } },
      );
    }

    if (filters.city) {
      orFilters.push(...this.buildCityWhereClauses(filters.city));
    }
    if (orFilters.length > 0) where.OR = orFilters;
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
        include: {
          agent: { select: { id: true, name: true, role: true } },
          images: true,
        },
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
  private buildCityWhereClauses(city: string): Prisma.PropertyWhereInput[] {
    const baseVariants = this.resolveCityVariants(city);
    const withAccents = baseVariants.map((variant) =>
      this.addSpanishDiacritics(variant),
    );

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

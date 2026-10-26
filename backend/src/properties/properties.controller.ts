import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Rol } from 'src/enums/roles.enum';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreatePropertyDto } from './dto/create-property.dto';
import { type UpdatePropertyDto } from './dto/update-property.dto';
import { type PropertyFilters } from './dto/filter-property.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private propertiesService: PropertiesService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.AGENT)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 10 }], {
      storage: memoryStorage(),
    }),
  )
  async create(
    @Body() data: CreatePropertyDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    return this.propertiesService.create(data, files?.images);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.AGENT)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdatePropertyDto) {
    return this.propertiesService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.AGENT)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }

  @Get('filterAndPaginated')
  async findAllFilteredAndPaginated(@Query() filters: PropertyFilters) {
    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.pageSize) || 10;

    return this.propertiesService.findAllFilteredAndPaginated({
      ...filters,
      page,
      pageSize,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Get()
  async findAll() {
    return this.propertiesService.findAll();
  }

  @Get('filters')
  async findAllFiltered(@Query() query: PropertyFilters) {
    const filters = {
      ...query,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      rooms: query.rooms ? Number(query.rooms) : undefined,
      bathrooms: query.bathrooms ? Number(query.bathrooms) : undefined,
    };
    return this.propertiesService.findAllFiltered(filters);
  }

  @Get('paginate')
  async findAllPaginated(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    const ten = 10;
    const pageNumber = parseInt(page, ten);
    const pageSizeNumber = parseInt(pageSize, ten);

    const { properties, total } = await this.propertiesService.findAllPaginated(
      pageNumber,
      pageSizeNumber,
    );

    return {
      data: properties,
      pagination: {
        page: pageNumber,
        pageSize: pageSizeNumber,
        total,
        totalPages: Math.ceil(total / pageSizeNumber),
      },
    };
  }
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 10 }], {
      storage: memoryStorage(),
    }),
  )
  async upload(@UploadedFiles() files: { images?: Express.Multer.File[] }) {
    if (!files?.images || files.images.length === 0)
      throw new BadRequestException('No files uploaded');

    const uploadedImages = await this.cloudinaryService.uploadFiles(
      files.images,
    );

    return uploadedImages.map((img) => ({
      url: img.url,
      public_id: img.public_id,
    }));
  }
}

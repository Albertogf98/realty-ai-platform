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
  Req,
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
import { PropertyFilterQueryDto } from './dto/filter-property.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';

const imageUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
        file.mimetype,
      )
    ) {
      callback(
        new BadRequestException('Only supported image files are allowed'),
        false,
      );
      return;
    }

    callback(null, true);
  },
};

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
    FileFieldsInterceptor(
      [{ name: 'images', maxCount: 10 }],
      imageUploadOptions,
    ),
  )
  async create(
    @Body() data: CreatePropertyDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.propertiesService.create(
      { ...data, agentId: request.user.id },
      files?.images,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.AGENT)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdatePropertyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.propertiesService.update(id, data, request.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.AGENT)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.propertiesService.remove(id, request.user.id);
  }

  @Get('filterAndPaginated')
  async findAllFilteredAndPaginated(@Query() filters: PropertyFilterQueryDto) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;

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
  async findAllFiltered(@Query() query: PropertyFilterQueryDto) {
    const filters = {
      ...query,
    };
    return this.propertiesService.findAllFiltered(filters);
  }

  @Get('paginate')
  async findAllPaginated(@Query() query: PropertyFilterQueryDto) {
    const pageNumber = query.page ?? 1;
    const pageSizeNumber = query.pageSize ?? 10;

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.AGENT)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'images', maxCount: 10 }],
      imageUploadOptions,
    ),
  )
  async upload(
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Req() request: AuthenticatedRequest,
  ) {
    if (!files?.images || files.images.length === 0)
      throw new BadRequestException('No files uploaded');

    const uploadedImages = await this.cloudinaryService.uploadFiles(
      files.images,
      `realestate/${request.user.id}`,
    );

    return uploadedImages.map((img) => ({
      url: img.url,
      public_id: img.public_id,
    }));
  }
}

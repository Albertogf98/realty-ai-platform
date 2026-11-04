import { Test } from '@nestjs/testing';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertiesRepository } from './properties.repository';
import { PropertiesService } from './properties.service';

describe('PropertiesService', () => {
  it('uploads listing images to the authenticated agent folder', async () => {
    const repository = {
      create: jest.fn().mockResolvedValue({ id: 'property-id' }),
    };
    const cloudinary = {
      uploadFile: jest.fn().mockResolvedValue({
        url: 'https://images.example/file.jpg',
        public_id: 'file',
      }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PropertiesRepository, useValue: repository },
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    const service = moduleRef.get(PropertiesService);
    const file = { buffer: Buffer.from('image') } as Express.Multer.File;
    const property: CreatePropertyDto = {
      title_es: 'Casa',
      title_en: 'House',
      description_es: 'Descripción',
      description_en: 'Description',
      price: 100_000,
      type: 'HOUSE',
      status: 'NEW',
      operation: 'SALE',
      rooms: 2,
      bathrooms: 1,
      sqm: 80,
      address: '1 Main Street',
      city: 'Madrid',
      state: 'Madrid',
      country: 'Spain',
      zipCode: '28001',
      agentId: 'agent-id',
      parking: false,
      garden: false,
    };

    await service.create(property, [file]);

    expect(cloudinary.uploadFile).toHaveBeenCalledWith(
      file,
      'realestate/agent-id',
    );
    await moduleRef.close();
  });
});

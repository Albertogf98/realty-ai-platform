import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Message } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class MessagesRepository {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findManyByProperty(propertyId: string): Promise<Message[]> {
    const cacheKey = `messages:property:${propertyId}`;
    const cached = await this.cache.get<Message[]>(cacheKey);
    if (cached) return cached;

    const messages = await this.prisma.message.findMany({
      where: { propertyId },
      include: { sender: true },
    });

    await this.cache.set(cacheKey, messages, 60);
    return messages;
  }

  async create(data: SendMessageDto) {
    const message = await this.prisma.message.create({ data });
    await this.cache.del(`messages:property:${data.propertyId}`);
    return message;
  }

  findPropertiesByUser(userId: string) {
    return this.prisma.property.findMany({
      where: { messages: { some: { senderId: userId } } },
      select: { id: true, title_es: true, title_en: true },
    });
  }

  findAll(page = 1, limit = 20) {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  markAsRead(propertyId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: { propertyId, senderId: { not: userId }, read: false },
      data: { read: true },
    });
  }

  findByPropertyAndUser(propertyId: string, senderId: string) {
    return this.prisma.message.findMany({ where: { propertyId, senderId } });
  }

  deleteByProperty(propertyId: string) {
    return this.prisma.message.deleteMany({
      where: { propertyId },
    });
  }
}

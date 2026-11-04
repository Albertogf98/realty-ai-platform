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
    const cacheKey = `messages:property:${propertyId}:v2`;
    const cached = await this.cache.get<Message[]>(cacheKey);
    if (cached) return cached;

    const messages = await this.prisma.message.findMany({
      where: { propertyId },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    await this.cache.set(cacheKey, messages, 60);
    return messages;
  }

  async create(data: SendMessageDto) {
    const message = await this.prisma.message.create({ data });
    await this.cache.del(`messages:property:${data.propertyId}:v2`);
    return message;
  }

  findPropertiesByUser(userId: string) {
    return this.prisma.property.findMany({
      where: { messages: { some: { senderId: userId } } },
      select: { id: true, title_es: true, title_en: true },
    });
  }

  findAllForUser(userId: string, isAgent: boolean, page = 1, limit = 20) {
    return this.prisma.message.findMany({
      where: isAgent
        ? { property: { agentId: userId } }
        : { property: { messages: { some: { senderId: userId } } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: { select: { id: true, name: true, role: true } },
        property: { select: { id: true, title_es: true, title_en: true } },
      },
    });
  }

  async isParticipant(propertyId: string, userId: string): Promise<boolean> {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ agentId: userId }, { messages: { some: { senderId: userId } } }],
      },
      select: { id: true },
    });

    return property !== null;
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

  deleteByPropertyAndSender(propertyId: string, senderId: string) {
    return this.prisma.message.deleteMany({
      where: { propertyId, senderId },
    });
  }
}

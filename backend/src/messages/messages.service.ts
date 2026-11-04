import { Injectable, NotFoundException } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';
import { Role } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private readonly repository: MessagesRepository) {}

  async send(senderId: string, propertyId: string, content: string) {
    return this.repository.create({ senderId, propertyId, content });
  }

  async findByProperty(propertyId: string, userId: string) {
    await this.assertParticipant(propertyId, userId);
    return this.repository.findManyByProperty(propertyId);
  }

  async assertParticipant(propertyId: string, userId: string) {
    if (!(await this.repository.isParticipant(propertyId, userId))) {
      throw new NotFoundException('Conversation not found');
    }
  }

  findPropertiesByUser(userId: string) {
    return this.repository.findPropertiesByUser(userId);
  }

  findAllForUser(userId: string, role: Role, page = 1, limit = 20) {
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(1, limit))
      : 20;
    return this.repository.findAllForUser(
      userId,
      role === Role.AGENT,
      safePage,
      safeLimit,
    );
  }

  async markAsRead(propertyId: string, userId: string) {
    await this.assertParticipant(propertyId, userId);
    return this.repository.markAsRead(propertyId, userId);
  }

  async findByPropertyAndUser(
    propertyId: string,
    senderId: string,
    userId: string,
  ) {
    await this.assertParticipant(propertyId, userId);
    if (!(await this.repository.isParticipant(propertyId, senderId))) {
      throw new NotFoundException('Conversation not found');
    }
    return this.repository.findByPropertyAndUser(propertyId, senderId);
  }

  async deleteConversation(propertyId: string, userId: string) {
    await this.assertParticipant(propertyId, userId);
    const result = await this.repository.deleteByPropertyAndSender(
      propertyId,
      userId,
    );
    return { deletedCount: result.count };
  }
}

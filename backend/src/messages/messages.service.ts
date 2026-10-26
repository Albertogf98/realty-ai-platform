import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(private readonly repository: MessagesRepository) {}

  async send(senderId: string, propertyId: string, content: string) {
    try {
      return await this.repository.create({ senderId, propertyId, content });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  findByProperty(propertyId: string) {
    return this.repository.findManyByProperty(propertyId);
  }

  findPropertiesByUser(userId: string) {
    return this.repository.findPropertiesByUser(userId);
  }

  findAll(page = 1, limit = 20) {
    return this.repository.findAll(page, limit);
  }

  markAsRead(propertyId: string, userId: string) {
    return this.repository.markAsRead(propertyId, userId);
  }

  findByPropertyAndUser(propertyId: string, senderId: string) {
    return this.repository.findByPropertyAndUser(propertyId, senderId);
  }

  async deleteConversation(propertyId: string) {
    try {
      const result = await this.repository.deleteByProperty(propertyId);
      return { deletedCount: result.count };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}

import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/cache/cache.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository, PrismaService, CacheService],
  exports: [MessagesService],
})
export class MessagesModule {}

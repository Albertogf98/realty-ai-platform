import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async send(@Body() dto: SendMessageDto) {
    return this.messagesService.send(dto.senderId, dto.propertyId, dto.content);
  }

  @Patch('read/:propertyId/:userId')
  async markAsRead(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.messagesService.markAsRead(propertyId, userId);
  }

  @Get('property/:propertyId')
  async findByProperty(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
  ) {
    return this.messagesService.findByProperty(propertyId);
  }

  @Get('user/:userId/properties')
  async findPropertiesByUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.messagesService.findPropertiesByUser(userId);
  }

  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.messagesService.findAll(Number(page), Number(limit));
  }

  @Get('property/:propertyId/sender/:senderId')
  async findByPropertyAndUser(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @Param('senderId', new ParseUUIDPipe()) senderId: string,
  ) {
    return this.messagesService.findByPropertyAndUser(propertyId, senderId);
  }

  @Delete(':propertyId')
  async deleteConversation(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
  ) {
    return this.messagesService.deleteConversation(propertyId);
  }
}

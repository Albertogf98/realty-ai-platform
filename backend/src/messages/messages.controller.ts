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
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async send(
    @Body() dto: SendMessageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.messagesService.send(
      request.user.id,
      dto.propertyId,
      dto.content,
    );
  }

  @Patch('read/:propertyId/:userId')
  async markAsRead(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertSelf(userId, request);
    return this.messagesService.markAsRead(propertyId, userId);
  }

  @Get('property/:propertyId')
  async findByProperty(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.messagesService.findByProperty(propertyId, request.user.id);
  }

  @Get('user/:userId/properties')
  async findPropertiesByUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertSelf(userId, request);
    return this.messagesService.findPropertiesByUser(userId);
  }

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Req() request: AuthenticatedRequest,
  ) {
    return this.messagesService.findAllForUser(
      request.user.id,
      request.user.role,
      Number(page),
      Number(limit),
    );
  }

  @Get('property/:propertyId/sender/:senderId')
  async findByPropertyAndUser(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @Param('senderId', new ParseUUIDPipe()) senderId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.messagesService.findByPropertyAndUser(
      propertyId,
      senderId,
      request.user.id,
    );
  }

  @Delete(':propertyId')
  async deleteConversation(
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.messagesService.deleteConversation(propertyId, request.user.id);
  }

  private assertSelf(userId: string, request: AuthenticatedRequest) {
    if (userId !== request.user.id) {
      throw new ForbiddenException('You can only manage your own messages');
    }
  }
}

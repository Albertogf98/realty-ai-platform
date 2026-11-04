import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Post()
  async add(
    @Body() { propertyId }: AddFavoriteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.favoritesService.add(request.user.id, propertyId);
  }

  @Delete(':userId/:propertyId')
  async remove(
    @Param('userId') userId: string,
    @Param('propertyId', new ParseUUIDPipe()) propertyId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertOwner(userId, request);
    return this.favoritesService.remove(userId, propertyId);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertOwner(userId, request);
    return this.favoritesService.getFavoritesByUser(userId);
  }

  private assertOwner(userId: string, request: AuthenticatedRequest) {
    if (request.user.id !== userId) {
      throw new ForbiddenException('You can only manage your own favorites');
    }
  }
}

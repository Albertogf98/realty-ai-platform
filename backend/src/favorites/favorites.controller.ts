import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';

@Controller('favorites')
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Post()
  async add(@Body() { userId, propertyId }: AddFavoriteDto) {
    return this.favoritesService.add(userId, propertyId);
  }

  @Delete(':userId/:propertyId')
  async remove(
    @Param('userId') userId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoritesService.remove(userId, propertyId);
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.favoritesService.getFavoritesByUser(userId);
  }
}

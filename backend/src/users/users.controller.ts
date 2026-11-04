import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('agents')
  async findAllAgents() {
    return this.usersService.findAllAgents();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    this.assertOwnerOrAdmin(id, request);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertOwnerOrAdmin(id, request);
    if (data.role !== undefined && request.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can change roles');
    }
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    this.assertOwnerOrAdmin(id, request);
    return this.usersService.remove(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  private assertOwnerOrAdmin(id: string, request: AuthenticatedRequest) {
    if (request.user.id !== id && request.user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only manage your own account');
    }
  }
}

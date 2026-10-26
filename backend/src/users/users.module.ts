import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { CacheService } from 'src/cache/cache.service';
import { TypesenseService } from 'src/typesense/typesense.service';
import { TypesenseModule } from 'src/typesense/typesense.module';

@Module({
  imports: [TypesenseModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, CacheService, TypesenseService],
})
export class UsersModule {}

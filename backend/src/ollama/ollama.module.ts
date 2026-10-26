import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OllamaController } from './ollama.controller';
import { OllamaService } from './ollama.service';
import { PropertiesModule } from 'src/properties/properties.module';

@Module({
  imports: [ConfigModule, PropertiesModule],
  controllers: [OllamaController],
  providers: [OllamaService],
  exports: [OllamaService],
})
export class OllamaModule {}

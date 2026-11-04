import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import type { Tool } from 'ollama';
import {
  Allow,
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OllamaService } from './ollama.service';

class AskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  question?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  system?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @Allow()
  format?: string | object | null;
}

class AskWithToolsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  question?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsObject({ each: true })
  tools?: Tool[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  system?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(2)
  temperature?: number;
}

class SearchPropertiesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  question: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => HistoryMessageDto)
  history?: HistoryMessageDto[];
}

class HistoryMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(4000)
  content: string;
}

@Controller('ollama')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Post('ask')
  async ask(@Body() dto: AskDto) {
    if (!dto?.question)
      throw new BadRequestException('Question is not defined');

    return this.ollamaService.ask(
      dto.question,
      dto.system,
      dto.temperature ?? 0.0,
      dto.format,
    );
  }

  @Post('ask-with-tools')
  async askWithTools(@Body() dto: AskWithToolsDto) {
    if (!dto?.question) {
      throw new BadRequestException('Question is not defined');
    }

    return this.ollamaService.askWithTools(
      dto.question,
      dto.tools ?? [],
      dto.system,
      dto.temperature ?? 0.0,
    );
  }

  @Post('search-properties')
  async searchProperties(
    @Body()
    dto: SearchPropertiesDto,
  ) {
    if (!dto?.question) {
      throw new BadRequestException('Question is not defined');
    }

    return this.ollamaService.searchPropertiesByQuestion(
      dto.question,
      Array.isArray(dto.history) ? dto.history : [],
    );
  }
}

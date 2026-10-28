import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { OllamaService } from './ollama.service';

class AskDto {
  question?: string;
  system?: string;
  temperature?: number;
  format?: string | object | null;
}

class AskWithToolsDto {
  question?: string;
  tools?: any[];
  system?: string;
  temperature?: number;
}

@Controller('ollama')
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
    dto: {
      question: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
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

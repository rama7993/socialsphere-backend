import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @Post('caption')
  async generateCaption(@Body() body: { imageBase64: string }) {
    if (!body.imageBase64) {
      throw new HttpException('Image is required', HttpStatus.BAD_REQUEST);
    }
    
    // Clean up base 64 prefix if present
    const base64 = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");

    return this.aiService.suggestCaption(base64);
  }

  @UseGuards(JwtAuthGuard)
  @Post('moderate')
  async moderate(@Body() body: { content: string }) {
    if (!body.content) {
      throw new HttpException('Content is required', HttpStatus.BAD_REQUEST);
    }

    return this.aiService.moderateContent(body.content);
  }
}

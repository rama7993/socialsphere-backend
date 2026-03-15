import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  create(@Body() createStoryDto: CreateStoryDto, @Request() req) {
    return this.storiesService.create(req.user, createStoryDto);
  }

  @Get()
  findAllFollowed(@Request() req) {
    return this.storiesService.findAllFollowed(req.user);
  }

  @Get('me')
  findMyStories(@Request() req) {
    return this.storiesService.findMyStories(req.user);
  }

  @Post(':id/seen')
  markSeen(@Param('id') id: string, @Request() req) {
    return this.storiesService.markSeen(req.user, id);
  }
}

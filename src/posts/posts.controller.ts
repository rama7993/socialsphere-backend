import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    createPostDto.userId = req.user.userId;
    return this.postsService.create(createPostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  getFeed(@Request() req, @Query() paginationDto: PaginationDto) {
    return this.postsService.findFeed(
      req.user.userId,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.postsService.findAll(paginationDto.page, paginationDto.limit);
  }

  @Get('user/:id')
  findByUser(@Param('id') id: string, @Query() paginationDto: PaginationDto) {
    return this.postsService.findByUser(
      id,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.postsService.remove(id, req.user.userId);
  }
}

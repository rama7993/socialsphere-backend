import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('post/:postId')
  toggleLike(@Param('postId') postId: string, @Request() req) {
    return this.likesService.toggleLike(req.user, postId);
  }

  @Get('post/:postId')
  countLikes(@Param('postId') postId: string) {
    return this.likesService.countLikes(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('post/:postId/check')
  checkLike(@Param('postId') postId: string, @Request() req) {
    return this.likesService.checkLike(req.user, postId);
  }
}

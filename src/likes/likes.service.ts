import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async toggleLike(user: User, postId: string): Promise<{ liked: boolean }> {
    const post = await this.postsRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.likesRepository.findOne({
      where: { user: { id: user.id }, post: { id: postId } },
    });

    if (existingLike) {
      await this.likesRepository.remove(existingLike);
      return { liked: false };
    } else {
      const newLike = this.likesRepository.create({ user, post });
      await this.likesRepository.save(newLike);
      return { liked: true };
    }
  }

  async countLikes(postId: string): Promise<number> {
    return this.likesRepository.count({ where: { post: { id: postId } } });
  }
}

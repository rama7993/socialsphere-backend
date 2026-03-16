import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private notificationsService: NotificationsService,
  ) {}

  async toggleLike(user: User, postId: string): Promise<{ liked: boolean }> {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });
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

      await this.notificationsService.create(
        post.author,
        user,
        NotificationType.LIKE,
        postId,
      );

      return { liked: true };
    }
  }

  async countLikes(postId: string): Promise<number> {
    return this.likesRepository.count({ where: { post: { id: postId } } });
  }

  async getLikers(postId: string) {
    try {
      const likes = await this.likesRepository.find({
        where: { post: { id: postId } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      return likes
        .filter((like) => !!like.user)
        .map(({ user }) => ({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
        }));
    } catch (error) {
      console.error('Error fetching likers:', error);
      throw error;
    }
  }

  async checkLike(user: User, postId: string): Promise<{ liked: boolean }> {
    const count = await this.likesRepository.count({
      where: { user: { id: user.id }, post: { id: postId } },
    });
    return { liked: count > 0 };
  }
}

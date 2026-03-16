import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    user: User,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const post = await this.postsRepository.findOne({
      where: { id: createCommentDto.postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let parentComment: Comment | null = null;
    if (createCommentDto.parentId) {
      parentComment = await this.commentsRepository.findOneBy({
        id: createCommentDto.parentId,
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      author: user,
      post,
      parent: parentComment || undefined,
    } as any) as unknown as Comment;

    const savedComment = await this.commentsRepository.save(comment);

    await this.notificationsService.create(
      post.author,
      user,
      NotificationType.COMMENT,
      post.id,
    );

    return savedComment;
  }

  async findByPost(postId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { post: { id: postId }, parent: IsNull() },
      relations: ['author', 'replies', 'replies.author', 'likes'],
      order: { createdAt: 'DESC' },
    });
  }

  async countByPost(postId: string): Promise<{ count: number }> {
    const count = await this.commentsRepository.count({
      where: { post: { id: postId } },
    });
    return { count };
  }

  async toggleLike(user: User, commentId: string): Promise<{ liked: boolean }> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['likes'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isLiked = comment.likes.some((u) => u.id === user.id);

    if (isLiked) {
      comment.likes = comment.likes.filter((u) => u.id !== user.id);
    } else {
      comment.likes.push(user);
    }
    await this.commentsRepository.save(comment);
    return { liked: !isLiked };
  }

  async remove(user: User, id: string): Promise<void> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== user.id) {
      throw new NotFoundException('You can only delete your own comments');
    }

    await this.commentsRepository.remove(comment);
  }
}

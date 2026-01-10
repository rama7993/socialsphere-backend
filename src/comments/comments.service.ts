import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async create(
    user: User,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const post = await this.postsRepository.findOneBy({
      id: createCommentDto.postId,
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

    return this.commentsRepository.save(comment);
  }

  async findByPost(postId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { post: { id: postId }, parent: IsNull() }, // Only fetch top-level comments
      relations: ['replies', 'replies.author', 'likes'], // Load replies and likes
      order: { createdAt: 'DESC' },
    });
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
}

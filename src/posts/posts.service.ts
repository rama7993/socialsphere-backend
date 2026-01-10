import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const user = await this.usersRepository.findOneBy({
      id: createPostDto.userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPost = this.postsRepository.create({
      ...createPostDto,
      author: user,
    });

    return this.postsRepository.save(newPost);
  }

  findAll(): Promise<Post[]> {
    return this.postsRepository.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findFeed(userId: string): Promise<Post[]> {
    return this.postsRepository.find({
      where: {
        author: {
          followers: {
            id: userId,
          },
        },
      },
      relations: ['author', 'author.followers'], // Load followers to check connection if needed, though 'where' clause does the filtering
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.id !== userId) {
      throw new NotFoundException('You can only delete your own posts');
    }

    await this.postsRepository.remove(post);
  }
}

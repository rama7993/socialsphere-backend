import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  findAll(page: number = 1, limit: number = 10): Promise<Post[]> {
    return this.postsRepository.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findFeed(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ posts: Post[]; followingCount: number }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followingCount = user.following.length;
    const followingIds = user.following.map((u) => u.id);
    
    // Include own posts in the feed as per common social media logic
    const authorIds = [...followingIds, userId];

    const posts = await this.postsRepository.find({
      where: {
        author: {
          id: In(authorIds),
        },
      },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { posts, followingCount };
  }

  findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<Post[]> {
    return this.postsRepository.find({
      where: { author: { id: userId } },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
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

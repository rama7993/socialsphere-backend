import {
  Injectable,
  OnModuleInit,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Story } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StoriesService implements OnModuleInit {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    @InjectRepository(Story)
    private storiesRepository: Repository<Story>,
  ) {}

  async onModuleInit() {
    const result = await this.storiesRepository.delete({
      user: IsNull(),
    });
    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} orphaned stories.`);
    }
  }

  async create(user: any, createStoryDto: CreateStoryDto): Promise<Story> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

    const story = this.storiesRepository.create({
      ...createStoryDto,
      user: { id: user.id } as User,
      expiresAt,
    });

    return this.storiesRepository.save(story);
  }

  async findAllFollowed(user: User): Promise<Story[]> {
    return this.storiesRepository.find({
      where: [
        {
          expiresAt: MoreThan(new Date()),
          user: {
            followers: {
              id: user.id,
            },
          },
        },
        {
          expiresAt: MoreThan(new Date()),
          user: { id: user.id },
        },
      ],
      relations: ['user', 'seenBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyStories(user: User): Promise<Story[]> {
    return this.storiesRepository.find({
      where: {
        user: { id: user.id },
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user', 'seenBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async markSeen(user: any, storyId: string): Promise<void> {
    const story = await this.storiesRepository.findOne({
      where: { id: storyId },
      relations: ['seenBy'],
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const alreadySeen = story.seenBy.some((u) => u.id === user.id);
    if (!alreadySeen) {
      story.seenBy.push({ id: user.id } as User);
      await this.storiesRepository.save(story);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    await this.storiesRepository.delete({
      expiresAt: LessThanOrEqual(new Date()),
    });
  }
}

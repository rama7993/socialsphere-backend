import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, Not, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersFilterDto } from './dto/filter-user.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(filterDto: UsersFilterDto, currentUserId?: string): Promise<User[]> {
    const { page = 1, limit = 10, search } = filterDto;
    const skip = (page - 1) * limit;

    let where: any = search
      ? [
          { firstName: Like(`%${search}%`) },
          { lastName: Like(`%${search}%`) },
          { username: Like(`%${search}%`) },
        ]
      : {};

    // Exclude current user from search results
    if (currentUserId) {
      if (Array.isArray(where)) {
        where = where.map((cond) => ({ ...cond, id: Not(currentUserId) }));
      } else {
        where.id = Not(currentUserId);
      }
    }

    return this.usersRepository.find({
      skip,
      take: limit,
      where,
    });
  }

  findOne(id: string): Promise<User | null> {
    return this.usersRepository
      .findOne({
        where: { id },
        relations: {
          followers: true,
          following: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
        },
      })
      .then((user) => {
        if (!user) return null;
        return {
          ...user,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          followers: undefined,
          following: undefined,
        } as any;
      });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async followUser(userId: string, targetUserId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });
    const targetUser = await this.usersRepository.findOneBy({
      id: targetUserId,
    });

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    if (userId === targetUserId) {
      return;
    }

    if (user.following.some((u) => u.id === targetUserId)) {
      return;
    }

    user.following.push(targetUser);
    await this.usersRepository.save(user);

    // Prevent duplicate follow notifications
    const existingNotification = await this.notificationsRepository.findOne({
      where: {
        recipient: { id: targetUser.id },
        actor: { id: user.id },
        type: NotificationType.FOLLOW,
      },
    });

    if (!existingNotification) {
      await this.notificationsService.create(
        targetUser,
        user,
        NotificationType.FOLLOW,
      );
    }
  }

  async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.following = user.following.filter((u) => u.id !== targetUserId);
    await this.usersRepository.save(user);
  }

  async getFollowers(userId: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.followers;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.following;
  }

  async removeFollower(userId: string, followerId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.followers = user.followers.filter((f) => f.id !== followerId);
    await this.usersRepository.save(user);
  }

  async create(user: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ resetPasswordToken: token });
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async getSuggestions(userId: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) throw new NotFoundException('User not found');

    const followingIds = user.following.map((u) => u.id);
    followingIds.push(userId);

    return this.usersRepository.find({
      where: {
        id: Not(In(followingIds)),
      },
      take: 10,
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.usersRepository.save(user);
  }
}

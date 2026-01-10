import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersFilterDto } from './dto/filter-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(filterDto: UsersFilterDto): Promise<User[]> {
    const { page = 1, limit = 10, search } = filterDto;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { firstName: Like(`%${search}%`) },
          { lastName: Like(`%${search}%`) },
          { username: Like(`%${search}%`) },
        ]
      : {};

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

    if (user.following.find((u) => u.id === targetUserId)) {
      return; // Already following
    }

    user.following.push(targetUser);
    await this.usersRepository.save(user);
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
}

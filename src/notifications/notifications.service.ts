import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(
    recipient: User,
    actor: User,
    type: NotificationType,
    relatedId?: string,
  ) {
    if (recipient.id === actor.id) return; // Don't notify self

    const notification = this.notificationsRepository.create({
      recipient,
      actor,
      type,
      relatedId,
    });
    return this.notificationsRepository.save(notification);
  }

  async findAll(userId: string) {
    return this.notificationsRepository.find({
      where: { recipient: { id: userId } },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async countUnread(userId: string) {
    const count = await this.notificationsRepository.count({
      where: { recipient: { id: userId }, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    await this.notificationsRepository.update(
      { id, recipient: { id: userId } },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.update(
      { recipient: { id: userId }, isRead: false },
      { isRead: true },
    );
  }
}

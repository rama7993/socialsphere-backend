import { Entity, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity()
@Unique(['user', 'post']) // Ensure unique like per user per post
export class Like extends BaseEntity {
  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Post)
  post: Post;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 应用使用原始事件实体
 * 存储从 Android 系统获取的原始事件数据
 */
@Entity('app_usage_raw_events')
@Index(['timestamp'])
@Index(['packageName'])
@Index(['eventType'])
@Index(['date'])
@Index(['packageName', 'timestamp'])
export class AppUsageRawEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  packageName!: string;

  @Column({ type: 'text', nullable: true })
  className?: string;

  @Column({ type: 'bigint' })
  timestamp!: number;

  @Column({ type: 'text' })
  eventType!: string; // 'ACTIVITY_RESUMED' | 'ACTIVITY_PAUSED'

  @Column({ type: 'text' })
  date!: string; // YYYY-MM-DD 格式，便于查询

  @CreateDateColumn()
  createdAt!: Date;
} 
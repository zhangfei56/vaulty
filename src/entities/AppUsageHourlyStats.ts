import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * 每小时使用统计实体
 * 预聚合的每小时统计数据，提高查询性能
 */
@Entity('app_usage_hourly_stats')
@Index(['date', 'hour'])
@Index(['packageName', 'date'])
@Unique(['date', 'hour', 'packageName'])
export class AppUsageHourlyStats {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  date!: string; // YYYY-MM-DD 格式

  @Column({ type: 'integer' })
  hour!: number; // 0-23

  @Column({ type: 'text' })
  packageName!: string;

  @Column({ type: 'text' })
  appName!: string;

  @Column({ type: 'bigint' })
  totalDuration!: number; // 该小时内的总使用时长

  @Column({ type: 'integer' })
  usageCount!: number; // 该小时内的使用次数

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 
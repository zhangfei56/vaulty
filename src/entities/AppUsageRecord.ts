import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('app_usage_records')
@Index(['date'])
@Index(['packageName'])
@Index(['date', 'packageName'])
export class AppUsageRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  packageName!: string;

  @Column({ type: 'text' })
  appName!: string;

  @Column({ type: 'bigint' })
  startTime!: number;

  @Column({ type: 'bigint' })
  endTime!: number;

  @Column({ type: 'bigint' })
  duration!: number;

  @Column({ type: 'text' })
  date!: string;

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

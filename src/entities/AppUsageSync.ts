import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('app_usage_sync')
export class AppUsageSync {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'bigint' })
  lastSync!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

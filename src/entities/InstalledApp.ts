import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 已安装应用实体
 * 存储设备上已安装应用的信息，支持逻辑删除
 */
@Entity('installed_apps')
@Index(['packageName'], { unique: true })
@Index(['isDeleted'])
@Index(['lastSyncTime'])
export class InstalledApp {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  packageName!: string;

  @Column({ type: 'varchar', length: 255 })
  appName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  versionName?: string;

  @Column({ type: 'bigint', default: 0 })
  versionCode!: number;

  @Column({ type: 'bigint', default: 0 })
  firstInstallTime!: number;

  @Column({ type: 'bigint', default: 0 })
  lastUpdateTime!: number;

  @Column({ type: 'boolean', default: false })
  isSystemApp!: boolean;

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'bigint' })
  lastSyncTime!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 
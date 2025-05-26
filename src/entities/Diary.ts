import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('diaries')
@Index(['createdAt'])
export class Diary {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  mood?: string;

  @Column({ type: 'text', nullable: true })
  tags?: string; // JSON string for tags array

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

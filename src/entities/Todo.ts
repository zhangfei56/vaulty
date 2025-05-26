import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('todos')
@Index(['completed'])
@Index(['dueDate'])
export class Todo {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @Column({ type: 'text', nullable: true })
  dueDate?: string;

  @Column({ type: 'text', nullable: true })
  priority?: string;

  @Column({ type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ type: 'text', nullable: true })
  recurringPattern?: string;

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @Column({ type: 'text', nullable: true })
  tags?: string; // JSON string for tags array

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

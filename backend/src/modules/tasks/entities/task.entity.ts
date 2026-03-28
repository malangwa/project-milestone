import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Milestone } from '../../milestones/entities/milestone.entity';
import { User } from '../../users/entities/user.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  BLOCKED = 'blocked',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export type TaskMaterialAssignment = {
  name: string;
  unit: string;
  quantity: number;
  source: 'manual' | 'store';
  stockItemId?: string | null;
  stockItemName?: string | null;
};

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Milestone, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'milestone_id' })
  milestone: Milestone;

  @Column({ name: 'milestone_id', nullable: true })
  milestoneId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Column({ name: 'assigned_to', nullable: true })
  assignedToId: string;

  @Column({ type: 'jsonb', nullable: true })
  materials: TaskMaterialAssignment[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  estimatedHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  actualHours: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

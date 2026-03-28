import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { MaterialRequestItem } from './material-request-item.entity';

export enum MaterialRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('material_requests')
export class MaterialRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  purpose: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  requestedAmount: number;

  @Column({
    type: 'enum',
    enum: MaterialRequestStatus,
    default: MaterialRequestStatus.PENDING,
  })
  status: MaterialRequestStatus;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requested_by' })
  requestedBy: User;

  @Column({ name: 'requested_by' })
  requestedById: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy: User;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => MaterialRequestItem, (item) => item.request, {
    cascade: true,
    eager: true,
  })
  items: MaterialRequestItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

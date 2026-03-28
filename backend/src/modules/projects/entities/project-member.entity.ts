import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';

export enum ProjectMemberRole {
  MANAGER = 'manager',
  ENGINEER = 'engineer',
  VIEWER = 'viewer',
  CLIENT = 'client',
  SUBCONTRACTOR = 'subcontractor',
}

@Entity('project_members')
@Unique(['projectId', 'userId'])
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ProjectMemberRole,
    default: ProjectMemberRole.ENGINEER,
  })
  role: ProjectMemberRole;

  @CreateDateColumn()
  joinedAt: Date;
}

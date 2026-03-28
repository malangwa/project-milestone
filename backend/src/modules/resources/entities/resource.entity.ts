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

export enum ResourceType {
  HUMAN = 'human',
  EQUIPMENT = 'equipment',
  MATERIAL = 'material',
  SOFTWARE = 'software',
  OTHER = 'other',
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'enum', enum: ResourceType, default: ResourceType.HUMAN })
  type: ResourceType;

  @Column({ type: 'varchar', nullable: true })
  role: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPerUnit: number;

  @Column({ type: 'varchar', default: 'hour' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

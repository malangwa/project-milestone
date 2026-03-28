import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'varchar' })
  filename: string;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar', nullable: true })
  mimeType: string;

  @Column({ type: 'int', nullable: true })
  size: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedById: string;

  @CreateDateColumn()
  createdAt: Date;
}

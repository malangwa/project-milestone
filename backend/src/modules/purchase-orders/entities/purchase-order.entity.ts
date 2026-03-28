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
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { MaterialRequest } from '../../material-requests/entities/material-request.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SENT = 'sent',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier, { eager: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'material_request_id', type: 'uuid', nullable: true })
  materialRequestId: string | null;

  @ManyToOne(() => MaterialRequest, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'material_request_id' })
  materialRequest: MaterialRequest;

  @Column({ name: 'order_number', type: 'varchar', unique: true })
  orderNumber: string;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({
    name: 'tax_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'requested_by' })
  requestedById: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requested_by' })
  requestedBy: User;

  @Column({ name: 'approved_by', nullable: true })
  approvedById: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @OneToMany(() => PurchaseOrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: PurchaseOrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

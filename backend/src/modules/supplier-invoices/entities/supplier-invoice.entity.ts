import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';

export enum SupplierInvoiceStatus {
  RECEIVED = 'received',
  VERIFIED = 'verified',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
}

@Entity('supplier_invoices')
export class SupplierInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier, { eager: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'invoice_number', type: 'varchar' })
  invoiceNumber: string;

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

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

  @Column({
    type: 'enum',
    enum: SupplierInvoiceStatus,
    default: SupplierInvoiceStatus.RECEIVED,
  })
  status: SupplierInvoiceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'file_url', type: 'varchar', nullable: true })
  fileUrl: string | null;

  @Column({ name: 'verified_by', nullable: true })
  verifiedById: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedBy: User | null;

  @Column({ name: 'approved_by', nullable: true })
  approvedById: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

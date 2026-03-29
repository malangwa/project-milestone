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
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { User } from '../../users/entities/user.entity';
import { GoodsReceiptItem } from './goods-receipt-item.entity';

export enum GoodsReceiptDestinationType {
  STORE = 'store',
  SITE = 'site',
}

export enum GoodsReceiptStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETED = 'completed',
}

@Entity('goods_receipts')
export class GoodsReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({
    type: 'enum',
    enum: GoodsReceiptStatus,
    default: GoodsReceiptStatus.PENDING,
  })
  status: GoodsReceiptStatus;

  @Column({ name: 'received_by' })
  receivedById: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'received_by' })
  receivedBy: User;

  @Column({
    name: 'received_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  receivedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    name: 'destination_type',
    type: 'enum',
    enum: GoodsReceiptDestinationType,
    default: GoodsReceiptDestinationType.STORE,
  })
  destinationType: GoodsReceiptDestinationType;

  @Column({ name: 'destination_label', type: 'varchar', nullable: true })
  destinationLabel: string | null;

  @OneToMany(() => GoodsReceiptItem, (item) => item.receipt, {
    cascade: true,
    eager: true,
  })
  items: GoodsReceiptItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

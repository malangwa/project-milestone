import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchase_order_id' })
  order: PurchaseOrder;

  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar' })
  unit: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 15, scale: 2 })
  unitPrice: number;

  @Column({ name: 'line_total', type: 'numeric', precision: 15, scale: 2 })
  lineTotal: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}

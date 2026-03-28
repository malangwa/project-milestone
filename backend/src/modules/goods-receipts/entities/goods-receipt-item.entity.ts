import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GoodsReceipt } from './goods-receipt.entity';

@Entity('goods_receipt_items')
export class GoodsReceiptItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GoodsReceipt, (receipt) => receipt.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'goods_receipt_id' })
  receipt: GoodsReceipt;

  @Column({ name: 'goods_receipt_id' })
  goodsReceiptId: string;

  @Column({ name: 'purchase_order_item_id', type: 'uuid', nullable: true })
  purchaseOrderItemId: string | null;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  unit: string;

  @Column({
    name: 'ordered_quantity',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  orderedQuantity: number;

  @Column({
    name: 'received_quantity',
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  receivedQuantity: number;

  @Column({
    name: 'damaged_quantity',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  damagedQuantity: number;

  @Column({
    name: 'accepted_quantity',
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  acceptedQuantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}

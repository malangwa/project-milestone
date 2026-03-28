import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockItem } from './stock-item.entity';
import { User } from '../../users/entities/user.entity';

export enum StockMovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stock_item_id' })
  stockItemId: string;

  @ManyToOne(() => StockItem, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'stock_item_id' })
  stockItem: StockItem;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  quantity: number;

  @Column({ name: 'reference_type', type: 'varchar', nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}

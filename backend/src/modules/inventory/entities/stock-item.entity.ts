import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StockStatus {
  AVAILABLE_IN_STORE = 'available_in_store',
  ALLOCATED_TO_SITE = 'allocated_to_site',
  ALLOCATED_TO_PROJECT = 'allocated_to_project',
}

@Entity('stock_items')
export class StockItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  unit: string;

  @Column({
    name: 'current_quantity',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  currentQuantity: number;

  @Column({
    name: 'reorder_level',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  reorderLevel: number;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({
    name: 'stock_status',
    type: 'enum',
    enum: StockStatus,
    default: StockStatus.AVAILABLE_IN_STORE,
  })
  stockStatus: StockStatus;

  @Column({ name: 'allocation_target', type: 'varchar', nullable: true })
  allocationTarget: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

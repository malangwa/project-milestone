import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

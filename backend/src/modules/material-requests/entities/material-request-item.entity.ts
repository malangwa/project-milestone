import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaterialRequest } from './material-request.entity';

@Entity('material_request_items')
export class MaterialRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MaterialRequest, (request) => request.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'material_request_id' })
  request: MaterialRequest;

  @Column({ name: 'material_request_id' })
  materialRequestId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar' })
  unit: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 15, scale: 2 })
  unitPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}

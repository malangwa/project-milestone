import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum PaymentMethod {
  PALMPESA = 'palmpesa',
  CASH = 'cash',
  CARD = 'card',
  MOBILE = 'mobile',
}

@Entity('subscription_payments')
export class SubscriptionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ type: 'varchar', nullable: true })
  palmPesaOrderId: string | null;

  @Column({ type: 'varchar', nullable: true })
  uzaInvoiceId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', default: 'TZS' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.PALMPESA })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'int', default: 1 })
  months: number;

  @Column({ type: 'text', nullable: true })
  rawResponse: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

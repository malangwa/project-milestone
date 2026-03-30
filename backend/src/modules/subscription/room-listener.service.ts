import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentClient } from '../ai-agent/agent-client';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { SubscriptionPayment, PaymentStatus } from './entities/subscription-payment.entity';

@Injectable()
export class RoomListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoomListenerService.name);
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastProcessedId = '';

  constructor(
    @Optional() private readonly agentClient: AgentClient,
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPayment)
    private readonly paymentRepo: Repository<SubscriptionPayment>,
  ) {}

  onModuleInit() {
    const token = process.env.AI_AGENT_TOKEN;
    const room  = process.env.AI_AGENT_ROOM ?? 'main-room';
    if (!this.agentClient || !token) {
      this.logger.warn('AgentClient or AI_AGENT_TOKEN not configured — room listener disabled');
      return;
    }
    this.agentClient.init(token, room);
    this.logger.log('Room listener started — polling every 30s for UZA-MANAGER events');
    this.pollInterval = setInterval(() => this.poll(), 30_000);
  }

  onModuleDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  private async poll() {
    try {
      const messages = await this.agentClient.history(50);
      for (const msg of messages) {
        if ((msg as any).id === this.lastProcessedId) break;
        if (msg.type !== 'event') continue;

        let payload: any;
        try {
          payload = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
        } catch {
          continue;
        }

        const eventType: string = payload?.event_type ?? '';

        if (eventType === 'payment_confirmed' && payload?.status === 'COMPLETED') {
          await this.handlePaymentConfirmed(payload);
        } else if (eventType === 'invoice_paid') {
          await this.handleInvoicePaid(payload);
        }
      }
      if (messages.length > 0) {
        this.lastProcessedId = (messages[0] as any).id ?? '';
      }
    } catch (err: any) {
      this.logger.warn(`Room poll error: ${err.message}`);
    }
  }

  private async handlePaymentConfirmed(payload: any) {
    const orderId: string = payload?.order_id ?? '';
    if (!orderId) return;

    const payment = await this.paymentRepo.findOne({ where: { palmPesaOrderId: orderId } });
    if (!payment || payment.status === PaymentStatus.SUCCESS) return;

    await this.paymentRepo.update(payment.id, {
      status: PaymentStatus.SUCCESS,
      rawResponse: JSON.stringify(payload),
    });

    const sub = await this.subRepo.findOne({ where: { id: payment.subscriptionId } });
    if (!sub) return;

    const start = new Date();
    const end   = new Date();
    end.setMonth(end.getMonth() + payment.months);

    await this.subRepo.update(sub.id, {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: start,
      currentPeriodEnd: end,
    });

    this.logger.log(
      `Subscription activated via UZA-MANAGER event: userId=${sub.userId} order=${orderId} until=${end.toISOString()}`,
    );
  }

  private async handleInvoicePaid(payload: any) {
    const invoiceId: string = String(payload?.invoice_id ?? '');
    if (!invoiceId) return;

    const payment = await this.paymentRepo.findOne({ where: { uzaInvoiceId: invoiceId } });
    if (!payment || payment.status === PaymentStatus.SUCCESS) return;

    await this.paymentRepo.update(payment.id, {
      status: PaymentStatus.SUCCESS,
      rawResponse: JSON.stringify(payload),
    });

    const sub = await this.subRepo.findOne({ where: { id: payment.subscriptionId } });
    if (!sub) return;

    const start = new Date();
    const end   = new Date();
    end.setMonth(end.getMonth() + payment.months);

    await this.subRepo.update(sub.id, {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: start,
      currentPeriodEnd: end,
    });

    this.logger.log(
      `Subscription activated via invoice_paid event: userId=${sub.userId} invoiceId=${invoiceId}`,
    );
  }
}

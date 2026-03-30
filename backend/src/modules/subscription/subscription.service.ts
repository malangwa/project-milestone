import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  PLAN_LIMITS,
} from './entities/subscription.entity';
import {
  SubscriptionPayment,
  PaymentStatus,
  PaymentMethod,
} from './entities/subscription-payment.entity';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

const UZA_BASE = process.env.UZA_MANAGER_BASE_URL ?? 'https://uzamanager-api.onrender.com/api';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPayment)
    private readonly paymentRepo: Repository<SubscriptionPayment>,
    private readonly http: HttpService,
  ) {}

  private async getUzaToken(): Promise<{ token: string; shopId: string }> {
    const email = process.env.UZA_MANAGER_EMAIL;
    const password = process.env.UZA_MANAGER_PASSWORD;
    const shopId = process.env.UZA_MANAGER_SHOP_ID ?? '';
    if (!email || !password) {
      throw new BadRequestException('UZA-MANAGER credentials not configured. Set UZA_MANAGER_EMAIL and UZA_MANAGER_PASSWORD in .env');
    }
    const res = await firstValueFrom(
      this.http.post(`${UZA_BASE}/auth/owner/login`, { email, password }),
    );
    const token: string = res.data?.token ?? res.data?.access_token ?? res.data?.accessToken;
    if (!token) throw new BadRequestException('UZA-MANAGER login failed: no token returned');
    return { token, shopId: res.data?.shop_id ?? shopId };
  }

  async getOrCreateSubscription(userId: string): Promise<Subscription> {
    let sub = await this.subRepo.findOne({ where: { userId } });
    if (!sub) {
      sub = this.subRepo.create({
        userId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
      });
      await this.subRepo.save(sub);
    }
    return sub;
  }

  async getSubscription(userId: string): Promise<Subscription & { limits: typeof PLAN_LIMITS[SubscriptionPlan] }> {
    const sub = await this.getOrCreateSubscription(userId);
    return { ...sub, limits: PLAN_LIMITS[sub.plan] };
  }

  async getPaymentHistory(userId: string): Promise<SubscriptionPayment[]> {
    const sub = await this.subRepo.findOne({ where: { userId } });
    if (!sub) return [];
    return this.paymentRepo.find({
      where: { subscriptionId: sub.id },
      order: { createdAt: 'DESC' },
    });
  }

  async initiatePalmPesaPayment(userId: string, dto: InitiatePaymentDto): Promise<{
    payment: SubscriptionPayment;
    palmPesaOrderId: string;
    message: string;
    checkStatusUrl: string;
  }> {
    if (dto.plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Cannot pay for a free plan');
    }
    const planInfo = PLAN_LIMITS[dto.plan];
    const totalAmount = planInfo.price * dto.months;

    const { token, shopId } = await this.getUzaToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      'shop-id': dto.uzaShopId ?? shopId,
      'x-shop-id': dto.uzaShopId ?? shopId,
      'Content-Type': 'application/json',
    };

    let palmPesaOrderId = '';
    let rawResponse = '';
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${UZA_BASE}/palmPesa/initiate`,
          { phone: dto.phone, months: dto.months },
          { headers },
        ),
      );
      palmPesaOrderId = res.data?.order_id ?? res.data?.orderId ?? res.data?.id ?? '';
      rawResponse = JSON.stringify(res.data);
      this.logger.log(`PalmPesa initiated: orderId=${palmPesaOrderId}`);
    } catch (err: any) {
      rawResponse = err?.response?.data ? JSON.stringify(err.response.data) : String(err.message);
      this.logger.warn(`PalmPesa initiate failed: ${rawResponse}`);
      throw new BadRequestException(`PalmPesa payment failed: ${rawResponse}`);
    }

    const sub = await this.getOrCreateSubscription(userId);
    const payment = this.paymentRepo.create({
      subscriptionId: sub.id,
      palmPesaOrderId,
      amount: totalAmount,
      currency: 'TZS',
      method: PaymentMethod.PALMPESA,
      status: PaymentStatus.PENDING,
      phone: dto.phone,
      months: dto.months,
      rawResponse,
    });
    await this.paymentRepo.save(payment);

    await this.subRepo.update(sub.id, {
      plan: dto.plan,
      status: SubscriptionStatus.PENDING,
      phone: dto.phone,
      uzaShopId: dto.uzaShopId ?? shopId,
    });

    return {
      payment,
      palmPesaOrderId,
      message: `Payment initiated. Check your phone (${dto.phone}) to complete the PalmPesa payment.`,
      checkStatusUrl: `/subscriptions/payment-status/${palmPesaOrderId}`,
    };
  }

  async checkPaymentStatus(userId: string, orderId: string): Promise<{
    status: string;
    payment: SubscriptionPayment | null;
    subscription: Subscription;
  }> {
    const sub = await this.subRepo.findOne({ where: { userId } });
    if (!sub) throw new NotFoundException('Subscription not found');

    const payment = await this.paymentRepo.findOne({
      where: { subscriptionId: sub.id, palmPesaOrderId: orderId },
    });

    let uzaStatus = 'unknown';
    try {
      const { token, shopId } = await this.getUzaToken();
      const res = await firstValueFrom(
        this.http.get(`${UZA_BASE}/palmPesa/status/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'shop-id': sub.uzaShopId ?? shopId,
            'x-shop-id': sub.uzaShopId ?? shopId,
          },
        }),
      );
      uzaStatus = res.data?.status ?? res.data?.paymentStatus ?? 'PENDING';
      if (payment) {
        const raw = JSON.stringify(res.data);
        if (['COMPLETED', 'success', 'paid'].includes(uzaStatus)) {
          await this.paymentRepo.update(payment.id, { status: PaymentStatus.SUCCESS, rawResponse: raw });
          await this.activateSubscription(sub, payment.months);
        } else if (['FAILED', 'CANCELLED', 'failed', 'cancelled', 'expired'].includes(uzaStatus)) {
          await this.paymentRepo.update(payment.id, { status: PaymentStatus.FAILED, rawResponse: raw });
          await this.subRepo.update(sub.id, { status: SubscriptionStatus.EXPIRED });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Status check failed for orderId=${orderId}: ${err.message}`);
    }

    const updatedSub = await this.subRepo.findOne({ where: { id: sub.id } });
    const updatedPayment = payment
      ? await this.paymentRepo.findOne({ where: { id: payment.id } })
      : null;

    return { status: uzaStatus, payment: updatedPayment, subscription: updatedSub! };
  }

  async handlePalmPesaCallback(body: any): Promise<{ received: boolean }> {
    const orderId: string = body?.orderId ?? body?.order_id ?? body?.id ?? '';
    const status: string = body?.status ?? body?.paymentStatus ?? '';
    this.logger.log(`PalmPesa callback: orderId=${orderId} status=${status}`);

    if (!orderId) return { received: true };

    const payment = await this.paymentRepo.findOne({ where: { palmPesaOrderId: orderId } });
    if (!payment) return { received: true };

    const raw = JSON.stringify(body);
    if (['COMPLETED', 'success', 'paid'].includes(status)) {
      await this.paymentRepo.update(payment.id, { status: PaymentStatus.SUCCESS, rawResponse: raw });
      const sub = await this.subRepo.findOne({ where: { id: payment.subscriptionId } });
      if (sub) await this.activateSubscription(sub, payment.months);
    } else if (['FAILED', 'CANCELLED', 'failed', 'cancelled'].includes(status)) {
      await this.paymentRepo.update(payment.id, { status: PaymentStatus.FAILED, rawResponse: raw });
    }
    return { received: true };
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const sub = await this.subRepo.findOne({ where: { userId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    await this.subRepo.update(sub.id, { status: SubscriptionStatus.CANCELLED });
    return this.subRepo.findOne({ where: { id: sub.id } }) as Promise<Subscription>;
  }

  async downgradeFree(userId: string): Promise<Subscription> {
    const sub = await this.getOrCreateSubscription(userId);
    await this.subRepo.update(sub.id, {
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: null,
    });
    return this.subRepo.findOne({ where: { id: sub.id } }) as Promise<Subscription>;
  }

  getPlans() {
    return Object.entries(PLAN_LIMITS).map(([plan, info]) => ({
      plan,
      ...info,
      currency: 'TZS',
      priceLabel: info.price === 0 ? 'Free' : `${info.price.toLocaleString()} TZS/month`,
      projectsLabel: info.projects === -1 ? 'Unlimited' : String(info.projects),
      usersLabel: info.users === -1 ? 'Unlimited' : String(info.users),
    }));
  }

  private async activateSubscription(sub: Subscription, months: number): Promise<void> {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + months);
    await this.subRepo.update(sub.id, {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: start,
      currentPeriodEnd: end,
    });
  }
}

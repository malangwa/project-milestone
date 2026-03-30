import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { RoomListenerService } from './room-listener.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPayment } from './entities/subscription-payment.entity';
import { AiAgentModule } from '../ai-agent/ai-agent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, SubscriptionPayment]),
    HttpModule,
    AiAgentModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, RoomListenerService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

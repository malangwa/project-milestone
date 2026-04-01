import { IsEnum, IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { SubscriptionPlan } from '../entities/subscription.entity';

export class InitiatePaymentDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsString()
  phone: string;

  @IsInt()
  @Min(1)
  @Max(12)
  months: number;

  @IsString()
  @IsOptional()
  uzaShopId?: string;

  @IsString()
  @IsOptional()
  subscriberName?: string;

  @IsString()
  @IsOptional()
  subscriberEmail?: string;
}

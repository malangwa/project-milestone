import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List all available subscription plans' })
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user subscription' })
  getMySubscription(@CurrentUser() user: User) {
    return this.subscriptionService.getSubscription(user.id);
  }

  @Get('me/payments')
  @ApiOperation({ summary: 'Get payment history for current user' })
  getPaymentHistory(@CurrentUser() user: User) {
    return this.subscriptionService.getPaymentHistory(user.id);
  }

  @Post('pay/palmpesa')
  @ApiOperation({ summary: 'Initiate PalmPesa mobile money payment for a plan' })
  initiatePayment(@CurrentUser() user: User, @Body() dto: InitiatePaymentDto) {
    return this.subscriptionService.initiatePalmPesaPayment(user.id, dto);
  }

  @Get('payment-status/:orderId')
  @ApiOperation({ summary: 'Check PalmPesa payment status by orderId' })
  checkStatus(@CurrentUser() user: User, @Param('orderId') orderId: string) {
    return this.subscriptionService.checkPaymentStatus(user.id, orderId);
  }

  @Post('callback/palmpesa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PalmPesa payment webhook callback (public)' })
  palmPesaCallback(@Body() body: any) {
    return this.subscriptionService.handlePalmPesaCallback(body);
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel current subscription' })
  cancel(@CurrentUser() user: User) {
    return this.subscriptionService.cancelSubscription(user.id);
  }

  @Post('downgrade')
  @ApiOperation({ summary: 'Downgrade to free plan' })
  downgrade(@CurrentUser() user: User) {
    return this.subscriptionService.downgradeFree(user.id);
  }
}

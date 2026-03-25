import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TimeTrackingService } from './time-tracking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('time-tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('time-tracking')
export class TimeTrackingController {
  constructor(private readonly time-trackingService: TimeTrackingService) {}
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}
}

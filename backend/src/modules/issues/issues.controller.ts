import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}
}

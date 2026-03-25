import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overall system summary' })
  getOverall() {
    return this.reportsService.getOverallSummary();
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get project-level summary report' })
  getProjectSummary(@Param('projectId') projectId: string) {
    return this.reportsService.getProjectSummary(projectId);
  }
}

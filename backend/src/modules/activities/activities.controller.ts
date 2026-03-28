import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get activity feed for a project' })
  findByProject(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    return this.activitiesService.findByProject(
      projectId,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}

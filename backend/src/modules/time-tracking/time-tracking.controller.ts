import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TimeTrackingService } from './time-tracking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('time-tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('time-tracking')
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post()
  create(@Body() body: any, @CurrentUser() user: User) {
    return this.timeTrackingService.create({ ...body, userId: user.id });
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get time entries by project' })
  findByProject(@Param('projectId') projectId: string) {
    return this.timeTrackingService.findByProject(projectId);
  }

  @Get('project/:projectId/total')
  @ApiOperation({ summary: 'Total hours logged for a project' })
  async totalHours(@Param('projectId') projectId: string) {
    const total = await this.timeTrackingService.totalHoursByProject(projectId);
    return { total };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my time entries' })
  findMine(@CurrentUser() user: User) {
    return this.timeTrackingService.findByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.timeTrackingService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.timeTrackingService.update(id, body); }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.timeTrackingService.remove(id); }
}

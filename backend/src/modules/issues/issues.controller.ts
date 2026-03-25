import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @ApiOperation({ summary: 'Report an issue' })
  create(@Body() body: any, @CurrentUser() user: User) {
    return this.issuesService.create({ ...body, reportedById: user.id });
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get issues by project' })
  findByProject(@Param('projectId') projectId: string) {
    return this.issuesService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.issuesService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.issuesService.remove(id);
  }
}

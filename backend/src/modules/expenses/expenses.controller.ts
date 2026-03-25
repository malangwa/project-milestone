import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Submit an expense' })
  create(@Body() body: any, @CurrentUser() user: User) {
    return this.expensesService.create({ ...body, submittedById: user.id });
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get expenses by project' })
  findByProject(@Param('projectId') projectId: string) {
    return this.expensesService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.expensesService.update(id, body);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve an expense (manager/admin only)' })
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.expensesService.approve(id, user.id, user.role);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject an expense (manager/admin only)' })
  reject(@Param('id') id: string, @CurrentUser() user: User) {
    return this.expensesService.reject(id, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateMaterialRequestDto } from './dto/create-material-request.dto';
import { MaterialRequestsService } from './material-requests.service';

@ApiTags('material-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MaterialRequestsController {
  constructor(
    private readonly materialRequestsService: MaterialRequestsService,
  ) {}

  @Get('projects/:projectId/material-requests')
  @ApiOperation({ summary: 'Get material requests for a project' })
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.materialRequestsService.findByProject(
      projectId,
      user.id,
      user.role,
    );
  }

  @Post('projects/:projectId/material-requests')
  @ApiOperation({ summary: 'Create a material request for a project' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMaterialRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.materialRequestsService.create(
      projectId,
      dto,
      user.id,
      user.role,
    );
  }

  @Patch('material-requests/:id/approve')
  @ApiOperation({ summary: 'Approve a material request' })
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.materialRequestsService.approve(id, user.id, user.role);
  }

  @Patch('material-requests/:id/reject')
  @ApiOperation({ summary: 'Reject a material request' })
  reject(@Param('id') id: string, @CurrentUser() user: User) {
    return this.materialRequestsService.reject(id, user.id, user.role);
  }
}

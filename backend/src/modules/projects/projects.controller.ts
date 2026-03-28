import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: User) {
    return this.projectsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all accessible projects' })
  findAll(@CurrentUser() user: User) {
    return this.projectsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.projectsService.findOne(id, user.id, user.role);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get project members' })
  getMembers(@Param('id') id: string, @CurrentUser() user: User) {
    return this.projectsService.getMembers(id, user.id, user.role);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to a project' })
  addMember(
    @Param('id') id: string,
    @Body() dto: CreateProjectMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.addMember(id, dto, user.id, user.role);
  }

  @Delete(':id/members/:memberUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a project' })
  removeMember(
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.removeMember(
      id,
      memberUserId,
      user.id,
      user.role,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.projectsService.remove(id, user.id, user.role);
  }
}

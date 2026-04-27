import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from './entities/user.entity';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all users (admin/manager only)' })
  findAll(@CurrentUser() user: User) {
    return this.usersService.findAll(user.id, user.role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Admin/Manager: create a new user' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: User) {
    // Managers cannot create admins or other managers
    if (
      user.role === UserRole.MANAGER &&
      dto.role &&
      [UserRole.ADMIN, UserRole.MANAGER].includes(dto.role)
    ) {
      throw new ForbiddenException(
        'Managers cannot create admin or manager accounts',
      );
    }
    return this.usersService.create(dto, user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  me(@CurrentUser() user: User) {
    return user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    return this.usersService.update(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Admin/Manager: update a user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    if (user.role === UserRole.MANAGER) {
      const target = await this.usersService.findById(id);
      // Managers can only edit users they created
      if (target.createdById !== user.id) {
        throw new ForbiddenException('You can only edit users you created');
      }
      // Managers cannot promote anyone to admin or manager
      if (
        dto.role &&
        [UserRole.ADMIN, UserRole.MANAGER].includes(dto.role)
      ) {
        throw new ForbiddenException(
          'Managers cannot assign admin or manager roles',
        );
      }
    }
    return this.usersService.update(id, dto);
  }
}

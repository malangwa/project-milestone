import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CommentEntityType } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment' })
  create(@Body() dto: CreateCommentDto, @CurrentUser() user: User) {
    return this.commentsService.create({ ...dto, authorId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Get comments for an entity' })
  findByEntity(
    @Query('entityType') entityType: CommentEntityType,
    @Query('entityId') entityId: string,
  ) {
    return this.commentsService.findByEntity(entityType, entityId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentsService.remove(id, user.id);
  }
}

import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CommentEntityType } from './entities/comment.entity';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment' })
  create(@Body() body: { entityType: CommentEntityType; entityId: string; content: string }, @CurrentUser() user: User) {
    return this.commentsService.create({ ...body, authorId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Get comments for an entity' })
  findByEntity(@Query('entityType') entityType: CommentEntityType, @Query('entityId') entityId: string) {
    return this.commentsService.findByEntity(entityType, entityId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentsService.remove(id, user.id);
  }
}

import { IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommentEntityType } from '../entities/comment.entity';

export class CreateCommentDto {
  @ApiProperty({ enum: CommentEntityType })
  @IsEnum(CommentEntityType)
  entityType: CommentEntityType;
  @ApiProperty() @IsUUID() entityId: string;
  @ApiProperty() @IsString() content: string;
}

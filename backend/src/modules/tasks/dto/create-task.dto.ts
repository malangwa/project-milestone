import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TaskStatus { TODO = 'todo', IN_PROGRESS = 'in_progress', REVIEW = 'review', DONE = 'done', BLOCKED = 'blocked' }
export enum TaskPriority { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', CRITICAL = 'critical' }

export class CreateTaskDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ enum: TaskStatus, required: false }) @IsEnum(TaskStatus) @IsOptional() status?: TaskStatus;
  @ApiProperty({ enum: TaskPriority, required: false }) @IsEnum(TaskPriority) @IsOptional() priority?: TaskPriority;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() milestoneId?: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() assignedToId?: string;
  @ApiProperty({ required: false }) @IsDateString() @IsOptional() dueDate?: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() estimatedHours?: number;
}

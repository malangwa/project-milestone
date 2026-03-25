import { IsString, IsEnum, IsOptional, IsDateString, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MilestoneStatus { PENDING = 'pending', IN_PROGRESS = 'in_progress', COMPLETED = 'completed', DELAYED = 'delayed' }

export class CreateMilestoneDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ enum: MilestoneStatus, required: false }) @IsEnum(MilestoneStatus) @IsOptional() status?: MilestoneStatus;
  @ApiProperty({ required: false }) @IsDateString() @IsOptional() dueDate?: string;
  @ApiProperty({ required: false }) @IsNumber() @Min(0) @Max(100) @IsOptional() progress?: number;
}

import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum IssueStatus { OPEN = 'open', IN_PROGRESS = 'in_progress', RESOLVED = 'resolved', CLOSED = 'closed' }
export enum IssuePriority { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', CRITICAL = 'critical' }

export class CreateIssueDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ enum: IssueStatus, required: false }) @IsEnum(IssueStatus) @IsOptional() status?: IssueStatus;
  @ApiProperty({ enum: IssuePriority, required: false }) @IsEnum(IssuePriority) @IsOptional() priority?: IssuePriority;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() assignedToId?: string;
}

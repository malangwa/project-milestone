import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() action: string;
  @ApiProperty() @IsString() entityType: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() entityId?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
}
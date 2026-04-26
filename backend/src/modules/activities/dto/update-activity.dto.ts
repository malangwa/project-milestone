import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateActivityDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() action?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() entityType?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
}
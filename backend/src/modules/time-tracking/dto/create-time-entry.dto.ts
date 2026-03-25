import { IsString, IsOptional, IsNumber, IsDateString, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTimeEntryDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() taskId?: string;
  @ApiProperty() @IsNumber() @Min(0.25) @Max(24) hours: number;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
}

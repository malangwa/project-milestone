import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus, Industry } from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() location?: string;
  @ApiProperty({ enum: ProjectStatus, required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
  @ApiProperty({ enum: Industry, required: false })
  @IsEnum(Industry)
  @IsOptional()
  industry?: Industry;
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() budget?: number;
}

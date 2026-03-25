import { IsString, IsEnum, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ResourceType } from '../entities/resource.entity';

export { ResourceType };

export class CreateResourceDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ResourceType }) @IsEnum(ResourceType) type: ResourceType;
  @ApiProperty({ required: false }) @IsString() @IsOptional() role?: string;
  @ApiProperty({ required: false }) @IsNumber() @Min(0) @IsOptional() costPerUnit?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() unit?: string;
  @ApiProperty({ required: false }) @IsNumber() @Min(0) @IsOptional() quantity?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

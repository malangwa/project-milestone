import { IsString, IsEnum, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ResourceType { HUMAN = 'human', EQUIPMENT = 'equipment', MATERIAL = 'material', SOFTWARE = 'software', OTHER = 'other' }

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

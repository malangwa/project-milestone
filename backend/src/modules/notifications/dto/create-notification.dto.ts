import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty() @IsUUID() userId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() message?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() link?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() type?: string;
}
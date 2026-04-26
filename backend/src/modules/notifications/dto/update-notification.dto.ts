import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() title?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() message?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() link?: string;
  @ApiProperty({ required: false }) @IsBoolean() @IsOptional() isRead?: boolean;
  @ApiProperty({ required: false }) @IsString() @IsOptional() type?: string;
}
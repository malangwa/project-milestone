import { IsString, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttachmentDto {
  @ApiProperty() @IsString() entityType: string;
  @ApiProperty() @IsString() entityId: string;
  @ApiProperty() @IsString() filename: string;
  @ApiProperty() @IsString() url: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() mimeType?: string;
  @ApiProperty({ required: false }) @IsNumber() @Min(0) @IsOptional() size?: number;
}

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() symbol: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateGoodsReceiptItemDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  purchaseOrderItemId?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  orderedQuantity?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  receivedQuantity: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  damagedQuantity?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

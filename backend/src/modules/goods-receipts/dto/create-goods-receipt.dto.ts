import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateGoodsReceiptItemDto } from './create-goods-receipt-item.dto';
import { GoodsReceiptDestinationType } from '../entities/goods-receipt.entity';

export class CreateGoodsReceiptDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    required: false,
    enum: GoodsReceiptDestinationType,
    default: GoodsReceiptDestinationType.STORE,
  })
  @IsEnum(GoodsReceiptDestinationType)
  @IsOptional()
  destinationType?: GoodsReceiptDestinationType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  destinationLabel?: string;

  @ApiProperty({ type: [CreateGoodsReceiptItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptItemDto)
  items: CreateGoodsReceiptItemDto[];
}

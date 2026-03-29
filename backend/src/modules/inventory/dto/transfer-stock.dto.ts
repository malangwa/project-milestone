import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StockStatus } from '../entities/stock-item.entity';

export class TransferStockDto {
  @ApiProperty({ enum: StockStatus })
  @IsEnum(StockStatus)
  stockStatus: StockStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  allocationTarget?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

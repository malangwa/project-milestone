import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSupplierInvoiceDto {
  @ApiProperty()
  @IsString()
  invoiceNumber: string;

  @ApiProperty()
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fileUrl?: string;
}

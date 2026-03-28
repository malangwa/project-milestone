import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExpenseCategory {
  LABOR = 'labor',
  MATERIAL = 'material',
  EQUIPMENT = 'equipment',
  TRAVEL = 'travel',
  OTHER = 'other',
}

export class CreateExpenseDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
  @ApiProperty() @IsNumber() @Min(0) amount: number;
  @ApiProperty({ enum: ExpenseCategory, required: false })
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;
  @ApiProperty({ required: false }) @IsDateString() @IsOptional() date?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

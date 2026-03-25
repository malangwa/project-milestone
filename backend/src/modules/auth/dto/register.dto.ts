import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole { ADMIN='admin', MANAGER='manager', ENGINEER='engineer', VIEWER='viewer', CLIENT='client', SUBCONTRACTOR='subcontractor' }

export class RegisterDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty({ enum: UserRole, required: false }) @IsEnum(UserRole) @IsOptional() role?: UserRole;
}

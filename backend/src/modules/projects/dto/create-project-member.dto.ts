import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectMemberRole } from '../entities/project-member.entity';

export class CreateProjectMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ProjectMemberRole, required: false })
  @IsEnum(ProjectMemberRole)
  @IsOptional()
  role?: ProjectMemberRole;
}

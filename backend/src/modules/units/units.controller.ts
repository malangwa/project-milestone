import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateUnitDto } from './dto/create-unit.dto';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  create(@Body() dto: CreateUnitDto) { return this.unitsService.create(dto); }

  @Get()
  findAll() { return this.unitsService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.unitsService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<CreateUnitDto>) { return this.unitsService.update(id, body); }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.unitsService.remove(id); }
}

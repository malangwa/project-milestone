import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.repo.create({
      ...dto,
      name: dto.name.trim(),
      contactName: dto.contactName?.trim() || null,
      email: dto.email?.trim().toLowerCase() || null,
      phone: dto.phone?.trim() || null,
      address: dto.address?.trim() || null,
      taxNumber: dto.taxNumber?.trim() || null,
      notes: dto.notes?.trim() || null,
    } as any);
    return this.repo.save(supplier as any);
  }

  async findAll(): Promise<Supplier[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.repo.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, {
      ...dto,
      name: dto.name?.trim(),
      contactName: dto.contactName?.trim(),
      email: dto.email?.trim().toLowerCase(),
      phone: dto.phone?.trim(),
      address: dto.address?.trim(),
      taxNumber: dto.taxNumber?.trim(),
      notes: dto.notes?.trim(),
    });
    return this.repo.save(supplier);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    await this.repo.remove(supplier);
  }
}

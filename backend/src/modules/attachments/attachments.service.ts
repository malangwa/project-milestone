import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { StorageService } from './storage.service';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
    private readonly storage: StorageService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    entityType: string,
    entityId: string,
    uploadedById: string,
    description?: string,
  ): Promise<Attachment> {
    const result = await this.storage.upload(file);

    return this.repo.save(
      this.repo.create({
        entityType,
        entityId,
        filename: file.originalname,
        url: result.url,
        storageKey: result.key,
        mimeType: result.mimeType,
        size: result.size,
        description: description?.trim() || undefined,
        uploadedById,
      }),
    );
  }

  async findByEntity(entityType: string, entityId: string): Promise<Attachment[]> {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Attachment> {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Attachment not found');
    return a;
  }

  async getDownloadUrl(id: string): Promise<string> {
    const a = await this.findOne(id);
    if (a.storageKey) {
      return this.storage.getSignedUrl(a.storageKey);
    }
    return a.url;
  }

  async remove(id: string): Promise<void> {
    const a = await this.findOne(id);
    if (a.storageKey) {
      await this.storage.delete(a.storageKey);
    }
    await this.repo.delete(id);
  }
}

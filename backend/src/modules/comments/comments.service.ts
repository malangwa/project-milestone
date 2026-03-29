import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentEntityType } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly repo: Repository<Comment>,
  ) {}

  async create(data: any): Promise<Comment> {
    const saved = await this.repo.save(
      this.repo.create(data) as unknown as Comment,
    );
    const comment = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });
    return comment ?? saved;
  }

  async findByEntity(
    entityType: CommentEntityType,
    entityId: string,
  ): Promise<Comment[]> {
    return this.repo.find({
      where: { entityType, entityId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.repo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId)
      throw new NotFoundException('Not your comment');
    await this.repo.remove(comment);
  }
}

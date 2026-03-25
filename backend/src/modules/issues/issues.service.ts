import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from './entities/issue.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly repo: Repository<Issue>,
  ) {}

  async create(data: Partial<Issue>): Promise<Issue> {
    return this.repo.save(this.repo.create(data));
  }

  async findByProject(projectId: string): Promise<Issue[]> {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Issue> {
    const issue = await this.repo.findOne({ where: { id } });
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  async update(id: string, data: Partial<Issue>): Promise<Issue> {
    await this.findOne(id);
    if (data.status === IssueStatus.RESOLVED) {
      (data as any).resolvedAt = new Date();
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const issue = await this.findOne(id);
    await this.repo.remove(issue);
  }
}

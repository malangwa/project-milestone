import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
  ) {}

  async create(dto: CreateProjectDto, ownerId: string): Promise<Project> {
    const project = this.projectsRepo.create({ ...dto, ownerId });
    return this.projectsRepo.save(project);
  }

  async findAll(userId: string, role: UserRole): Promise<Project[]> {
    if (role === UserRole.ADMIN) {
      return this.projectsRepo.find({ order: { createdAt: 'DESC' } });
    }
    return this.projectsRepo.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId: string, role: UserRole): Promise<Project> {
    const project = await this.findOne(id);
    if (role !== UserRole.ADMIN && project.ownerId !== userId) {
      throw new ForbiddenException('Not authorized to update this project');
    }
    Object.assign(project, dto);
    return this.projectsRepo.save(project);
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const project = await this.findOne(id);
    if (role !== UserRole.ADMIN && project.ownerId !== userId) {
      throw new ForbiddenException('Not authorized to delete this project');
    }
    await this.projectsRepo.remove(project);
  }
}

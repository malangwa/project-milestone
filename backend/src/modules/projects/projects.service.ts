import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import {
  ProjectMember,
  ProjectMemberRole,
} from './entities/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMembersRepo: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private async getAccessibleUserIds(userId: string): Promise<string[]> {
    const accessibleIds = new Set<string>([userId]);
    let frontier = [userId];

    while (frontier.length > 0) {
      const children = await this.usersRepo.find({
        where: frontier.map((createdById) => ({ createdById })),
      });

      frontier = [];
      for (const child of children) {
        if (!accessibleIds.has(child.id)) {
          accessibleIds.add(child.id);
          frontier.push(child.id);
        }
      }
    }

    return [...accessibleIds];
  }

  async create(dto: CreateProjectDto, ownerId: string): Promise<Project> {
    const project = this.projectsRepo.create({ ...dto, ownerId });
    return this.projectsRepo.save(project);
  }

  async findAll(userId: string, role: UserRole): Promise<Project[]> {
    if (role === UserRole.ADMIN) {
      return this.projectsRepo.find({ order: { createdAt: 'DESC' } });
    }

    // Projects owned by the user or by users in their created-by tree
    const accessibleUserIds = await this.getAccessibleUserIds(userId);

    // Plus projects where the user is a member
    const memberships = await this.projectMembersRepo.find({
      where: { userId },
      select: ['projectId'],
    });
    const memberProjectIds = memberships.map((m) => m.projectId);

    const projectIds = new Set<string>();
    const ownedProjects = await this.projectsRepo.find({
      where: { ownerId: In(accessibleUserIds) },
      order: { createdAt: 'DESC' },
    });
    ownedProjects.forEach((p) => projectIds.add(p.id));

    const memberProjects = memberProjectIds.length > 0
      ? await this.projectsRepo.find({
          where: { id: In(memberProjectIds) },
        })
      : [];

    const all = [...ownedProjects];
    memberProjects.forEach((p) => {
      if (!projectIds.has(p.id)) {
        projectIds.add(p.id);
        all.push(p);
      }
    });

    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return all;
  }

  private async getProjectOrThrow(id: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async canAccessProject(
    project: Project,
    userId: string,
    role: UserRole,
  ): Promise<boolean> {
    if (role === UserRole.ADMIN) {
      return true;
    }

    const accessibleUserIds = await this.getAccessibleUserIds(userId);
    if (accessibleUserIds.includes(project.ownerId)) {
      return true;
    }

    // Also allow if user is a member of the project
    const membership = await this.projectMembersRepo.findOne({
      where: { projectId: project.id, userId },
    });
    if (membership) {
      return true;
    }

    return false;
  }

  private async canManageProject(
    project: Project,
    userId: string,
    role: UserRole,
  ): Promise<boolean> {
    if (role === UserRole.ADMIN) return true;
    if (project.ownerId === userId) return true;

    // A project-level MANAGER member can also manage
    const membership = await this.projectMembersRepo.findOne({
      where: { projectId: project.id, userId },
    });
    if (membership?.role === ProjectMemberRole.MANAGER) return true;

    return false;
  }

  async findOne(id: string, userId: string, role: UserRole): Promise<Project> {
    const project = await this.getProjectOrThrow(id);
    if (!(await this.canAccessProject(project, userId, role))) {
      throw new ForbiddenException('Not authorized to view this project');
    }
    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    userId: string,
    role: UserRole,
  ): Promise<Project> {
    const project = await this.findOne(id, userId, role);
    if (role !== UserRole.ADMIN && project.ownerId !== userId) {
      throw new ForbiddenException('Not authorized to update this project');
    }
    Object.assign(project, dto);
    return this.projectsRepo.save(project);
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const project = await this.findOne(id, userId, role);
    if (role !== UserRole.ADMIN && project.ownerId !== userId) {
      throw new ForbiddenException('Not authorized to delete this project');
    }
    await this.projectsRepo.remove(project);
  }

  async getMembers(
    projectId: string,
    userId: string,
    role: UserRole,
  ): Promise<ProjectMember[]> {
    await this.findOne(projectId, userId, role);
    return this.projectMembersRepo.find({
      where: { projectId },
      order: { joinedAt: 'ASC' },
    });
  }

  async addMember(
    projectId: string,
    dto: CreateProjectMemberDto,
    userId: string,
    role: UserRole,
  ): Promise<ProjectMember> {
    const project = await this.findOne(projectId, userId, role);
    if (!(await this.canManageProject(project, userId, role))) {
      throw new ForbiddenException('Not authorized to manage project members');
    }
    const memberUser = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (!memberUser) throw new NotFoundException('User not found');
    if (memberUser.id === project.ownerId) {
      throw new ConflictException(
        'Project owner is already part of the project',
      );
    }

    const existing = await this.projectMembersRepo.findOne({
      where: { projectId, userId: memberUser.id },
    });
    if (existing)
      throw new ConflictException('User is already a member of this project');

    const member = this.projectMembersRepo.create({
      projectId,
      userId: memberUser.id,
      role: dto.role ?? ProjectMemberRole.ENGINEER,
    });
    return this.projectMembersRepo.save(member);
  }

  async removeMember(
    projectId: string,
    memberUserId: string,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const project = await this.findOne(projectId, userId, role);
    if (!(await this.canManageProject(project, userId, role))) {
      throw new ForbiddenException('Not authorized to manage project members');
    }
    if (memberUserId === project.ownerId) {
      throw new ForbiddenException('Project owner cannot be removed');
    }

    const member = await this.projectMembersRepo.findOne({
      where: { projectId, userId: memberUserId },
    });
    if (!member) throw new NotFoundException('Member not found');
    await this.projectMembersRepo.remove(member);
  }
}

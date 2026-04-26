import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskMaterialAssignment } from './entities/task.entity';
import { StockItem } from '../inventory/entities/stock-item.entity';
import {
  StockMovement,
  StockMovementType,
} from '../inventory/entities/stock-movement.entity';
import { AgentClient } from '../ai-agent/agent-client';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
    @InjectRepository(StockItem)
    private readonly stockRepo: Repository<StockItem>,
    @InjectRepository(StockMovement)
    private readonly movementsRepo: Repository<StockMovement>,
    @Optional() private readonly agentClient: AgentClient,
  ) {}

  private normalizeMaterials(
    materials?: TaskMaterialAssignment[] | null,
  ): TaskMaterialAssignment[] {
    return (materials ?? [])
      .filter(Boolean)
      .map((material) => ({
        ...material,
        name: String(material.name ?? '').trim(),
        unit: String(material.unit ?? '').trim(),
        quantity: Number(material.quantity ?? 0),
        source: (material.source === 'store' ? 'store' : 'manual') as 'manual' | 'store',
        stockItemId: material.stockItemId ?? null,
        stockItemName: material.stockItemName ?? null,
      }))
      .filter(
        (material) =>
          material.name.length > 0 &&
          material.unit.length > 0 &&
          material.quantity > 0,
      );
  }

  private async applyMaterials(
    task: Task,
    materials: TaskMaterialAssignment[],
    userId: string,
    reverse = false,
  ): Promise<TaskMaterialAssignment[]> {
    const resolved: TaskMaterialAssignment[] = [];

    for (const material of materials) {
      if (material.source !== 'store') {
        resolved.push(material);
        continue;
      }

      if (!material.stockItemId) {
        throw new BadRequestException(
          `Store material "${material.name}" must reference a stock item`,
        );
      }

      const stockItem = await this.stockRepo.findOne({
        where: { id: material.stockItemId, projectId: task.projectId },
      });
      if (!stockItem) {
        throw new NotFoundException(
          `Stock item not found for material "${material.name}"`,
        );
      }

      const quantity = Number(material.quantity);
      const currentQuantity = Number(stockItem.currentQuantity);
      if (!reverse && currentQuantity < quantity) {
        throw new ConflictException(
          `Not enough stock for "${stockItem.name}". Available: ${currentQuantity}, requested: ${quantity}`,
        );
      }

      stockItem.currentQuantity = reverse
        ? currentQuantity + quantity
        : currentQuantity - quantity;
      await this.stockRepo.save(stockItem);

      await this.movementsRepo.save(
        this.movementsRepo.create({
          stockItemId: stockItem.id,
          type: reverse ? StockMovementType.IN : StockMovementType.OUT,
          quantity,
          referenceType: reverse
            ? 'task_assignment_reversal'
            : 'task_assignment',
          referenceId: task.id,
          notes: reverse
            ? `Reversed task assignment for: ${task.title}`
            : `Assigned to task: ${task.title}`,
          createdById: userId,
        } as any) as any,
      );

      resolved.push({
        ...material,
        stockItemName: material.stockItemName || stockItem.name,
      });
    }

    return resolved;
  }

  async create(data: any, userId?: string, userRole?: UserRole): Promise<Task> {
    if (
      userRole === UserRole.VIEWER ||
      userRole === UserRole.CLIENT
    ) {
      throw new ForbiddenException('Your role is not allowed to create tasks');
    }
    const { materials, ...taskData } = data;
    const task = await this.repo.save(
      this.repo.create(taskData) as unknown as Task,
    );

    const normalizedMaterials = this.normalizeMaterials(materials);
    if (normalizedMaterials.length > 0) {
      task.materials = await this.applyMaterials(
        task,
        normalizedMaterials,
        userId || task.createdById || '',
      );
      await this.repo.save(task);
    }

    return this.findOne(task.id);
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return this.repo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByMilestone(milestoneId: string): Promise<Task[]> {
    return this.repo.find({
      where: { milestoneId },
      order: { priority: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Task not found');
    return t;
  }

  async update(id: string, data: any, userId?: string, userRole?: UserRole): Promise<Task> {
    const existing = await this.findOne(id);
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      existing.createdById !== userId
    ) {
      throw new ForbiddenException('Not authorized to update this task');
    }
    const hasMaterials = Object.prototype.hasOwnProperty.call(
      data,
      'materials',
    );
    const { materials, ...taskData } = data;

    await this.repo.update(id, taskData);

    if (hasMaterials) {
      const previousMaterials = this.normalizeMaterials(existing.materials);
      if (previousMaterials.length > 0) {
        await this.applyMaterials(
          existing,
          previousMaterials,
          userId || existing.createdById || '',
          true,
        );
      }

      const updated = await this.findOne(id);
      const normalizedMaterials = this.normalizeMaterials(materials);
      updated.materials =
        normalizedMaterials.length > 0
          ? await this.applyMaterials(
              updated,
              normalizedMaterials,
              userId || updated.createdById || '',
            )
          : [];
      await this.repo.save(updated);
    }

    const updated = await this.findOne(id);

    // Broadcast task_update if status changed
    if (data.status && data.status !== existing.status && this.agentClient) {
      const agentToken = process.env.AI_AGENT_TOKEN;
      const room = process.env.AI_AGENT_ROOM || 'main-room';
      if (agentToken) {
        this.agentClient.init(agentToken, room);
        this.agentClient.event({
          event_type: 'task_update',
          task: updated.title,
          task_id: updated.id,
          project_id: updated.projectId,
          status: updated.status,
          previous_status: existing.status,
          priority: updated.priority,
          assignee: updated.assignedTo?.name || null,
        }).catch(() => {});
      }
    }

    return updated;
  }

  async remove(id: string, userId?: string, userRole?: UserRole): Promise<void> {
    const t = await this.findOne(id);
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      t.createdById !== userId
    ) {
      throw new ForbiddenException('Not authorized to delete this task');
    }
    const materials = this.normalizeMaterials(t.materials);
    if (materials.length > 0) {
      await this.applyMaterials(
        t,
        materials,
        userId || t.createdById || '',
        true,
      );
    }
    await this.repo.remove(t);
  }
}

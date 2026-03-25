import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SearchService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async search(q: string) {
    const term = `%${q.toLowerCase()}%`;

    const [projects, milestones, tasks, issues] = await Promise.all([
      this.dataSource.query(
        `SELECT id, name AS title, status, 'project' AS type FROM projects WHERE LOWER(name) LIKE $1 LIMIT 10`,
        [term],
      ),
      this.dataSource.query(
        `SELECT m.id, m.name AS title, m.status, 'milestone' AS type, m.project_id AS "projectId"
         FROM milestones m WHERE LOWER(m.name) LIKE $1 LIMIT 10`,
        [term],
      ),
      this.dataSource.query(
        `SELECT t.id, t.title, t.status, 'task' AS type, t.project_id AS "projectId"
         FROM tasks t WHERE LOWER(t.title) LIKE $1 LIMIT 10`,
        [term],
      ),
      this.dataSource.query(
        `SELECT i.id, i.title, i.status, 'issue' AS type, i.project_id AS "projectId"
         FROM issues i WHERE LOWER(i.title) LIKE $1 LIMIT 10`,
        [term],
      ),
    ]);

    return { projects, milestones, tasks, issues };
  }
}

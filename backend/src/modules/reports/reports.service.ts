import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getProjectSummary(projectId: string) {
    const [tasks, expenses, issues, milestones] = await Promise.all([
      this.dataSource.query(
        `SELECT status, COUNT(*) as count FROM tasks WHERE project_id = $1 GROUP BY status`,
        [projectId],
      ),
      this.dataSource.query(
        `SELECT status, COALESCE(SUM(amount),0) as total FROM expenses WHERE project_id = $1 GROUP BY status`,
        [projectId],
      ),
      this.dataSource.query(
        `SELECT status, COUNT(*) as count FROM issues WHERE project_id = $1 GROUP BY status`,
        [projectId],
      ),
      this.dataSource.query(
        `SELECT status, COUNT(*) as count, AVG(progress) as avg_progress FROM milestones WHERE project_id = $1 GROUP BY status`,
        [projectId],
      ),
    ]);
    return { projectId, tasks, expenses, issues, milestones };
  }

  async getOverallSummary() {
    const [projectCount, taskCount, expenseTotal, issueCount] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) as count FROM projects`),
      this.dataSource.query(`SELECT status, COUNT(*) as count FROM tasks GROUP BY status`),
      this.dataSource.query(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE status = 'approved'`),
      this.dataSource.query(`SELECT status, COUNT(*) as count FROM issues GROUP BY status`),
    ]);
    return {
      projects: parseInt(projectCount[0]?.count ?? '0'),
      tasks: taskCount,
      approvedExpenses: parseFloat(expenseTotal[0]?.total ?? '0'),
      issues: issueCount,
    };
  }
}

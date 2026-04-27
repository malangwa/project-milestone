/* eslint-disable no-console */
import 'reflect-metadata';
import AppDataSource from '../data-source';

/**
 * One-time migration: promote self-registered users (createdById IS NULL)
 * who currently have role = 'engineer' to role = 'manager' (owner).
 *
 * This is idempotent - safe to run multiple times.
 */
async function run() {
  await AppDataSource.initialize();
  try {
    const result = await AppDataSource.query(
      `UPDATE users
         SET role = 'manager'
       WHERE role = 'engineer'
         AND "createdById" IS NULL
       RETURNING id, email`,
    );
    const rows = (Array.isArray(result) ? result[0] : []) as Array<{
      id: string;
      email: string;
    }>;
    console.log(
      `[promote-owners] Updated ${rows.length} self-registered user(s) to manager.`,
    );
    rows.forEach((r) => console.log(`  - ${r.email} (${r.id})`));
  } catch (err) {
    console.error('[promote-owners] Failed:', err);
    process.exitCode = 1;
  } finally {
    await AppDataSource.destroy();
  }
}

void run();

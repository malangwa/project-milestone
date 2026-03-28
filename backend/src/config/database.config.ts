import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return { url: databaseUrl };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'project_milestone',
  };
});

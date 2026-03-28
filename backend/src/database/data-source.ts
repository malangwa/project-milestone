import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';

const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

const base: Partial<DataSourceOptions> = databaseUrl
  ? { url: databaseUrl }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'project_milestone',
    };

const AppDataSource = new DataSource({
  type: 'postgres',
  ...base,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
} as DataSourceOptions);

export default AppDataSource;

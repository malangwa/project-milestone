import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import r2Config from './config/r2.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MilestonesModule } from './modules/milestones/milestones.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { UnitsModule } from './modules/units/units.module';
import { IssuesModule } from './modules/issues/issues.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { TimeTrackingModule } from './modules/time-tracking/time-tracking.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SearchModule } from './modules/search/search.module';
import { MaterialRequestsModule } from './modules/material-requests/material-requests.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { SupplierInvoicesModule } from './modules/supplier-invoices/supplier-invoices.module';
import { GoodsReceiptsModule } from './modules/goods-receipts/goods-receipts.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AiAgentModule } from './modules/ai-agent/ai-agent.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, r2Config],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = process.env.NODE_ENV === 'production';
        const databaseUrl = config.get<string>('database.url');

        const base = databaseUrl
          ? { url: databaseUrl }
          : {
              host: config.get('database.host'),
              port: config.get('database.port'),
              username: config.get('database.username'),
              password: config.get('database.password'),
              database: config.get('database.database'),
            };

        return {
          type: 'postgres' as const,
          ...base,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
          synchronize: process.env.DB_SYNCHRONIZE
            ? process.env.DB_SYNCHRONIZE === 'true'
            : !isProduction,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    UsersModule,
    ProjectsModule,
    MilestonesModule,
    TasksModule,
    ExpensesModule,
    ResourcesModule,
    ActivitiesModule,
    UnitsModule,
    IssuesModule,
    CommentsModule,
    AttachmentsModule,
    TimeTrackingModule,
    NotificationsModule,
    ReportsModule,
    AuditLogsModule,
    SearchModule,
    MaterialRequestsModule,
    SuppliersModule,
    PurchaseOrdersModule,
    SupplierInvoicesModule,
    GoodsReceiptsModule,
    InventoryModule,
    AiAgentModule,
    SubscriptionModule,
  ],
})
export class AppModule {}

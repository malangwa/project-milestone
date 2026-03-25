import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
      }),
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
  ],
})
export class AppModule {}

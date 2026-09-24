import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { ResponsesModule } from './modules/responses/responses.module.js';
import { ShareModule } from './modules/share/share.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { BlocksModule } from './modules/blocks/blocks.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { ScheduleModule } from './modules/schedule/schedule.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    EventsModule,
    ResponsesModule,
    ShareModule,
    BlocksModule,
    ReportsModule,
    AdminModule,
    ScheduleModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

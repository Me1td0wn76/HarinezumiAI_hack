import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { throttlerOptions } from './common/throttle.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { ResponsesModule } from './modules/responses/responses.module.js';
import { ShareModule } from './modules/share/share.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { BlocksModule } from './modules/blocks/blocks.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { ScheduleModule } from './modules/schedule/schedule.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { FollowsModule } from './modules/follows/follows.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(throttlerOptions),
    PrismaModule,
    NotificationsModule,
    MailModule,
    AuthModule,
    UsersModule,
    EventsModule,
    ResponsesModule,
    ShareModule,
    BlocksModule,
    ReportsModule,
    AdminModule,
    CommentsModule,
    ScheduleModule,
    FollowsModule,
    // GET /users/:handle。/users/me などを先に登録するため UsersModule より後に置く
    ProfilesModule,
  ],
  controllers: [AppController],
  // 全エンドポイントにレート制限を掛ける（上限は common/throttle.ts）
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

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
import { NotificationsModule } from './modules/notifications/notifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(throttlerOptions),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    EventsModule,
    ResponsesModule,
    ShareModule,
  ],
  controllers: [AppController],
  // 全エンドポイントにレート制限を掛ける（上限は common/throttle.ts）
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

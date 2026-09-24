import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { ResponsesModule } from './modules/responses/responses.module.js';
import { ShareModule } from './modules/share/share.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { ScheduleModule } from './modules/schedule/schedule.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    NotificationsModule,
    MailModule,
    AuthModule,
    UsersModule,
    EventsModule,
    ResponsesModule,
    ShareModule,
    CommentsModule,
    ScheduleModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';
import { EventsService } from '../events/events.service.js';
import { UsersRepository } from '../users/users.repository.js';
import { ReportsRepository } from './reports.repository.js';
import { ReportDto } from './dto/report.dto.js';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reports: ReportsRepository,
    private readonly events: EventsService,
    private readonly users: UsersRepository,
  ) {}

  async reportEvent(reporter: User, eventId: string, dto: ReportDto): Promise<void> {
    const event = await this.events.findVisibleOrThrow(eventId, reporter);
    if (event.organizerId === reporter.id) throw new BadRequestException('自分のLT会は通報できません');
    await this.reports.upsert({
      reporterId: reporter.id,
      targetType: 'EVENT',
      targetId: eventId,
      reason: dto.reason,
      detail: dto.detail?.trim() || null,
    });
  }

  async reportUser(reporter: User, userId: string, dto: ReportDto): Promise<void> {
    if (userId === reporter.id) throw new BadRequestException('自分自身は通報できません');
    if (!(await this.users.findById(userId))) throw new NotFoundException('ユーザーが見つかりません');
    await this.reports.upsert({
      reporterId: reporter.id,
      targetType: 'USER',
      targetId: userId,
      reason: dto.reason,
      detail: dto.detail?.trim() || null,
    });
  }
}

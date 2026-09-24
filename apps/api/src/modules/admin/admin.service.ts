import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdminReportDto } from '@lt/shared';
import type { User } from '../../generated/prisma/client.js';
import { EventsRepository } from '../events/events.repository.js';
import { ReportsRepository } from '../reports/reports.repository.js';
import { AdminRepository } from './admin.repository.js';
import { ModerateEventDto } from './dto/moderate-event.dto.js';

/** 画面に出す対象の数。これ以上は通報の少ないものから切り捨てる */
const REPORT_TARGET_LIMIT = 50;
const RECENT_REPORTS_PER_TARGET = 5;

@Injectable()
export class AdminService {
  constructor(
    private readonly admin: AdminRepository,
    private readonly reports: ReportsRepository,
    private readonly events: EventsRepository,
  ) {}

  /** 通報を対象ごとにまとめ、多い順に返す */
  async listReports(): Promise<AdminReportDto[]> {
    const summaries = await this.reports.summarizeByTarget(REPORT_TARGET_LIMIT);
    const eventIds = summaries.filter((s) => s.targetType === 'EVENT').map((s) => s.targetId);
    const userIds = summaries.filter((s) => s.targetType === 'USER').map((s) => s.targetId);
    const [events, users, reports] = await Promise.all([
      this.admin.findEvents(eventIds),
      this.admin.findUsers(userIds),
      this.reports.findByTargets(summaries),
    ]);
    const eventById = new Map(events.map((e) => [e.id, e]));
    const userById = new Map(users.map((u) => [u.id, u]));

    return summaries.map((s): AdminReportDto => {
      const mine = reports.filter((r) => r.targetType === s.targetType && r.targetId === s.targetId);
      const reasonCounts: AdminReportDto['reasonCounts'] = {};
      for (const r of mine) reasonCounts[r.reason] = (reasonCounts[r.reason] ?? 0) + 1;
      const event = s.targetType === 'EVENT' ? eventById.get(s.targetId) : undefined;
      const user = s.targetType === 'USER' ? userById.get(s.targetId) : undefined;
      return {
        targetType: s.targetType,
        targetId: s.targetId,
        label: event?.title ?? user?.displayName ?? null,
        hidden: event ? event.hiddenAt !== null : null,
        reportCount: s.reportCount,
        reasonCounts,
        recent: mine.slice(0, RECENT_REPORTS_PER_TARGET).map((r) => ({
          reason: r.reason,
          detail: r.detail,
          createdAt: r.createdAt.toISOString(),
        })),
        lastReportedAt: s.lastReportedAt.toISOString(),
      };
    });
  }

  async setEventHidden(admin: User, eventId: string, hidden: boolean, dto: ModerateEventDto): Promise<void> {
    if (!(await this.events.findById(eventId))) throw new NotFoundException('LT会が見つかりません');
    await this.admin.setEventHidden({ adminId: admin.id, eventId, hidden, note: dto.note?.trim() || null });
  }
}

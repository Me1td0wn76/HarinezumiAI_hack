import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Report, ReportReason, ReportTargetType } from '../../generated/prisma/client.js';

export interface ReportTargetSummary {
  targetType: ReportTargetType;
  targetId: string;
  reportCount: number;
  lastReportedAt: Date;
}

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 同じ人が同じ対象を再通報したら理由を上書きする（件数は増やさない） */
  async upsert(input: {
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    detail: string | null;
  }): Promise<void> {
    const { reporterId, targetType, targetId, reason, detail } = input;
    await this.prisma.report.upsert({
      where: { reporterId_targetType_targetId: { reporterId, targetType, targetId } },
      create: input,
      update: { reason, detail, createdAt: new Date() },
    });
  }

  /** 通報の多い順に対象をまとめる */
  async summarizeByTarget(limit: number): Promise<ReportTargetSummary[]> {
    const groups = await this.prisma.report.groupBy({
      by: ['targetType', 'targetId'],
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: [{ _count: { targetId: 'desc' } }, { _max: { createdAt: 'desc' } }],
      take: limit,
    });
    return groups.map((g) => ({
      targetType: g.targetType,
      targetId: g.targetId,
      reportCount: g._count._all,
      lastReportedAt: g._max.createdAt ?? new Date(0),
    }));
  }

  findByTargets(targets: { targetType: ReportTargetType; targetId: string }[]): Promise<Report[]> {
    if (targets.length === 0) return Promise.resolve([]);
    return this.prisma.report.findMany({
      where: { OR: targets.map((t) => ({ targetType: t.targetType, targetId: t.targetId })) },
      orderBy: { createdAt: 'desc' },
    });
  }
}

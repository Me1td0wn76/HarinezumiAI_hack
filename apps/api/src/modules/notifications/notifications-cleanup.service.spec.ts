import { NotificationsCleanupService } from './notifications-cleanup.service.js';
import { RETENTION_DAYS, type NotificationsRepository } from './notifications.repository.js';

describe('NotificationsCleanupService', () => {
  const NOW = new Date('2026-10-01T00:00:00Z');

  it(`既読から${RETENTION_DAYS}日より前の通知を消す`, async () => {
    const repo = { deleteReadBefore: vi.fn().mockResolvedValue(3) };
    const service = new NotificationsCleanupService(repo as unknown as NotificationsRepository);

    await service.deleteOldReadNotifications(NOW);

    expect(repo.deleteReadBefore).toHaveBeenCalledWith(new Date('2026-07-03T00:00:00Z'));
  });

  it('削除に失敗しても例外を投げない（翌日また実行される）', async () => {
    const repo = { deleteReadBefore: vi.fn().mockRejectedValue(new Error('db down')) };
    const service = new NotificationsCleanupService(repo as unknown as NotificationsRepository);

    await expect(service.deleteOldReadNotifications(NOW)).resolves.toBeUndefined();
  });
});

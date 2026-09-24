import { applyDecorators } from '@nestjs/common';
import { IsOptional, Matches, ValidateIf } from 'class-validator';
import { DISCORD_WEBHOOK_URL_PATTERN } from '../../notifications/discord-webhook.service.js';

/** 任意の Discord Webhook URL。null・空文字は「設定しない / 解除」として通す */
export function IsOptionalDiscordWebhookUrl() {
  return applyDecorators(
    IsOptional(),
    ValidateIf((_obj, value) => value !== ''),
    Matches(DISCORD_WEBHOOK_URL_PATTERN, {
      message: 'Webhook URL は https://discord.com/api/webhooks/... の形式で入力してください',
    }),
  );
}

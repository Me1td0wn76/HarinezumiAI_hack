import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  /** 死活監視用 */
  @Get('health')
  @SkipThrottle()
  health() {
    return { ok: true };
  }
}

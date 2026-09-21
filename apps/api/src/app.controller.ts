import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** 死活監視用 */
  @Get('health')
  health() {
    return { ok: true };
  }
}

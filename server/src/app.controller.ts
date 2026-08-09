import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { CsrfService } from './auth/csrf.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly csrfService: CsrfService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = this.csrfService.generateCsrfToken(req, res);
    return {
      success: true,
      csrfToken: token,
    };
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { BankSchemesService } from './bank-schemes.service';
import { StaffGuard } from '../auth/staff.guard';

@Controller('bank-schemes')
@UseGuards(StaffGuard)
export class BankSchemesController {
  constructor(private readonly svc: BankSchemesService) {}

  private resolveBankContext(req: any): string | undefined {
    // If bank user, filter strictly by their associated bank
    if (req.user?.role === 'bank') {
      return req.user.firstName || undefined;
    }
    // Staff/admin can optionally filter via header or query
    const headerBank = req.headers['x-selected-bank'];
    return headerBank ? headerBank.toString() : undefined;
  }

  @Get()
  async list(@Req() req: any, @Query('bankName') bankName?: string) {
    const activeBank = bankName || this.resolveBankContext(req);
    const data = await this.svc.listSchemes(activeBank);
    return { success: true, data };
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const bankName = this.resolveBankContext(req) || body.bankName || 'SBI';
    const data = await this.svc.createScheme({ ...body, bankName });
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.svc.updateScheme(id, body);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const data = await this.svc.deleteScheme(id);
    return { success: true, ...data };
  }
}

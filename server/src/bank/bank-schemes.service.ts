import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BankSchemesService {
  private readonly logger = new Logger(BankSchemesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient();
  }

  async listSchemes(bankName?: string): Promise<any[]> {
    let query = this.db.from('BankScheme').select('*').order('createdAt', { ascending: false });
    
    if (bankName) {
      query = query.ilike('bankName', `%${bankName}%`);
    }

    const { data, error } = await query;
    if (error) {
      this.logger.error(`Failed to list schemes: ${error.message}`);
      throw error;
    }
    return data || [];
  }

  async createScheme(schemeData: any): Promise<any> {
    this.logger.log(`Creating scheme: ${schemeData.schemeName} for Bank: ${schemeData.bankName}`);
    
    const { data, error } = await this.db
      .from('BankScheme')
      .insert({
        bankName: schemeData.bankName,
        schemeName: schemeData.schemeName,
        interestRate: parseFloat(schemeData.interestRate),
        minLoanAmount: parseFloat(schemeData.minLoanAmount),
        maxLoanAmount: parseFloat(schemeData.maxLoanAmount),
        validFrom: new Date(schemeData.validFrom).toISOString(),
        validTo: new Date(schemeData.validTo).toISOString(),
        status: schemeData.status || 'ACTIVE',
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create scheme: ${error.message}`);
      throw error;
    }
    return data;
  }

  async updateScheme(id: string, schemeData: any): Promise<any> {
    this.logger.log(`Updating scheme: ${id}`);

    const payload: any = {
      updatedAt: new Date().toISOString()
    };
    if (schemeData.bankName) payload.bankName = schemeData.bankName;
    if (schemeData.schemeName) payload.schemeName = schemeData.schemeName;
    if (schemeData.interestRate !== undefined) payload.interestRate = parseFloat(schemeData.interestRate);
    if (schemeData.minLoanAmount !== undefined) payload.minLoanAmount = parseFloat(schemeData.minLoanAmount);
    if (schemeData.maxLoanAmount !== undefined) payload.maxLoanAmount = parseFloat(schemeData.maxLoanAmount);
    if (schemeData.validFrom) payload.validFrom = new Date(schemeData.validFrom).toISOString();
    if (schemeData.validTo) payload.validTo = new Date(schemeData.validTo).toISOString();
    if (schemeData.status) payload.status = schemeData.status;

    const { data, error } = await this.db
      .from('BankScheme')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update scheme: ${error.message}`);
      throw error;
    }
    if (!data) throw new NotFoundException(`Scheme with ID "${id}" not found`);
    return data;
  }

  async deleteScheme(id: string): Promise<any> {
    this.logger.log(`Deleting/Deactivating scheme: ${id}`);
    
    // Perform soft delete by marking INACTIVE
    const { data, error } = await this.db
      .from('BankScheme')
      .update({ status: 'INACTIVE', updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to delete scheme: ${error.message}`);
      throw error;
    }
    return { success: true, data };
  }

  /**
   * Daily CRON method: checks validity ranges and updates expired schemes.
   */
  async expireExpiredSchemes(): Promise<number> {
    this.logger.log('[Cron] Checking for expired bank schemes...');
    const nowStr = new Date().toISOString();

    const { data, error } = await this.db
      .from('BankScheme')
      .update({ status: 'EXPIRED', updatedAt: nowStr })
      .eq('status', 'ACTIVE')
      .lt('validTo', nowStr)
      .select();

    if (error) {
      this.logger.error(`Failed to expire schemes: ${error.message}`);
      return 0;
    }

    const count = data ? data.length : 0;
    if (count > 0) {
      this.logger.log(`[Cron] Auto-expired ${count} schemes successfully.`);
    }
    return count;
  }
}

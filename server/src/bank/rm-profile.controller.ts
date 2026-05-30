import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { StaffGuard } from '../auth/staff.guard';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('rm-profiles')
@UseGuards(StaffGuard)
export class RmProfileController {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient();
  }

  // ==================== RELATIONSHIP MANAGER (RM) CRUD ====================

  @Get()
  async listRms(@Query('bankName') bankName?: string) {
    let query = this.db.from('RMProfile').select('*').order('name', { ascending: true });
    if (bankName) {
      query = query.ilike('bankName', `%${bankName}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  }

  @Post()
  async createRm(@Body() body: any) {
    const { data, error } = await this.db
      .from('RMProfile')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        bankName: body.bankName,
        branchName: body.branchName || null,
        isActive: body.isActive !== undefined ? body.isActive : true
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  }

  @Put(':id')
  async updateRm(@Param('id') id: string, @Body() body: any) {
    const payload: any = {};
    if (body.name) payload.name = body.name;
    if (body.email) payload.email = body.email;
    if (body.phone) payload.phone = body.phone;
    if (body.bankName) payload.bankName = body.bankName;
    if (body.branchName !== undefined) payload.branchName = body.branchName;
    if (body.isActive !== undefined) payload.isActive = body.isActive;

    const { data, error } = await this.db
      .from('RMProfile')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException(`RM with ID "${id}" not found`);
    return { success: true, data };
  }

  @Delete(':id')
  async deleteRm(@Param('id') id: string) {
    const { data, error } = await this.db
      .from('RMProfile')
      .update({ isActive: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  }

  // ==================== OFFICER TARGET TRACKER ====================

  @Post('targets')
  async setTarget(@Body() body: { officerEmail: string; targetMonth: string; targetAmount: number; targetCount: number }) {
    const { data, error } = await this.db
      .from('OfficerTarget')
      .insert({
        officerEmail: body.officerEmail,
        targetMonth: body.targetMonth,
        targetAmount: parseFloat(body.targetAmount as any),
        targetCount: parseInt(body.targetCount as any, 10),
        actualAmount: 0.0,
        actualCount: 0
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  }

  @Get('targets/:officerEmail')
  async getTargetProgress(@Param('officerEmail') officerEmail: string, @Query('month') month?: string) {
    const targetMonth = month || new Date().toISOString().substring(0, 7); // Default to current month e.g., '2026-05'

    // Fetch the target
    const { data: targetList, error: targetError } = await this.db
      .from('OfficerTarget')
      .select('*')
      .eq('officerEmail', officerEmail)
      .eq('targetMonth', targetMonth)
      .limit(1);
    const target = targetList && targetList.length > 0 ? targetList[0] : null;

    if (targetError) throw targetError;

    // Fetch sanctioned applications allocated to this officer
    // (As a premium model, we filter applications where the loan is sanctioned, and the staff profile is linked to the officer's email or ID)
    const { data: staffUserList } = await this.db.from('User').select('id').eq('email', officerEmail).limit(1);
    const staffUser = staffUserList && staffUserList.length > 0 ? staffUserList[0] : null;
    
    let query = this.db.from('LoanApplication').select('id, amount, status');
    if (staffUser) {
      // Find applicant profiles assigned to this staff user
      const { data: assignedProfiles } = await this.db.from('StaffProfile').select('linkedUserId').eq('assignedStaffId', staffUser.id);
      const userIds = (assignedProfiles || []).map(p => p.linkedUserId);
      if (userIds.length > 0) {
        query = query.in('userId', userIds);
      } else {
        query = query.eq('userId', 'NONE');
      }
    } else {
      query = query.eq('email', officerEmail);
    }

    const { data: applications } = await query;
    const apps = applications || [];
    
    const sanctionedApps = apps.filter((a: any) => a.status === 'sanctioned');
    const actualAmount = sanctionedApps.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const actualCount = sanctionedApps.length;

    const targetAmount = target ? Number(target.targetAmount) : 25000000; // 2.5 Crore default target
    const targetCount = target ? Number(target.targetCount) : 10; // 10 loans default target

    const progressPercent = Math.min(Math.round((actualAmount / targetAmount) * 100), 100);

    return {
      success: true,
      officerEmail,
      month: targetMonth,
      hasConfiguredTarget: !!target,
      targetAmount,
      targetCount,
      actualAmount,
      actualCount,
      progressPercent,
      isTargetMet: actualAmount >= targetAmount
    };
  }
}

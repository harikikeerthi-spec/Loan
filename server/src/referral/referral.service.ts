import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ReferralService {
  private readonly logger = { warn: (m: string) => console.warn(m) };

  private get db() {
    return this.supabase.getClient();
  }

  constructor(private readonly supabase: SupabaseService) {}

  @OnEvent('bank.application.disbursed')
  async handleApplicationDisbursed(event: { applicationId: string; userId: string; amount: number; bankId?: string }) {
    if (event.userId) {
      try {
        await this.completeReferral(event.userId);
      } catch (error) {
        console.error(`[ReferralService] Failed to process application disbursed event for user: ${event.userId}`, error);
      }
    }
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async getOrCreateReferralCode(userId: string) {
    const { data: user } = await this.db
      .from('User')
      .select('id, referralCode, firstName, lastName, email')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found');
    if (user.referralCode) return { referralCode: user.referralCode, user };

    let code = '';
    let exists = true;
    while (exists) {
      code = this.generateCode();
      const { data: existing } = await this.db.from('User').select('id').eq('referralCode', code).single();
      exists = !!existing;
    }

    const { data: updated, error } = await this.db
      .from('User')
      .update({ referralCode: code })
      .eq('id', userId)
      .select('id, referralCode, firstName, lastName, email')
      .single();

    if (error) throw error;

    // Also populate referral_codes table
    try {
      await this.db.from('referral_codes').insert({
        code,
        userId
      });
    } catch (e) {
      console.warn('[ReferralService] Failed to populate referral_codes table:', e.message);
    }

    return { referralCode: updated.referralCode, user: updated };
  }

  async getReferralStats(userId: string) {
    const { data: user } = await this.db
      .from('User')
      .select('referralCode, firstName')
      .eq('id', userId)
      .single();

    const [
      { count: totalReferrals },
      { count: completedReferrals },
      { count: signedUpReferrals },
      { count: pendingReferrals },
      { count: totalVisits },
    ] = await Promise.all([
      this.db.from('referrals').select('*', { count: 'exact', head: true }).eq('referrerId', userId),
      this.db.from('referrals').select('*', { count: 'exact', head: true }).eq('referrerId', userId).in('status', ['completed', 'rewarded', 'paid']),
      this.db.from('referrals').select('*', { count: 'exact', head: true }).eq('referrerId', userId).eq('status', 'signed_up'),
      this.db.from('referrals').select('*', { count: 'exact', head: true }).eq('referrerId', userId).eq('status', 'pending'),
      this.db.from('ReferralVisit').select('*', { count: 'exact', head: true }).eq('referrerId', userId),
    ]);

    const completedCount = completedReferrals || 0;
    let tier = 'starter';
    let nextTierAt: number | null = 3;
    if (completedCount >= 10) { tier = 'diamond'; nextTierAt = null; }
    else if (completedCount >= 7) { tier = 'gold'; nextTierAt = 10; }
    else if (completedCount >= 5) { tier = 'silver'; nextTierAt = 7; }
    else if (completedCount >= 3) { tier = 'bronze'; nextTierAt = 5; }

    const rewards = this.calculateRewards(completedCount);

    return {
      referralCode: user?.referralCode,
      firstName: user?.firstName,
      totalReferrals: totalReferrals || 0,
      completedReferrals: completedCount,
      signedUpReferrals: signedUpReferrals || 0,
      pendingReferrals: pendingReferrals || 0,
      totalVisits: totalVisits || 0,
      tier,
      nextTierAt,
      rewards,
    };
  }

  async getReferralList(userId: string) {
    const { data: referrals } = await this.db
      .from('referrals')
      .select('*, referee:User!refereeId(firstName, lastName, email)')
      .eq('referrerId', userId)
      .order('createdAt', { ascending: false });

    return (referrals || []).map((r: any) => ({
      id: r.id,
      refereeEmail: r.refereeEmail || r.referee?.email,
      refereeName: r.referee ? `${r.referee.firstName || ''} ${r.referee.lastName || ''}`.trim() : null,
      status: r.status,
      reward: r.reward,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    }));
  }

  async validateReferralCode(code: string) {
    const { data: user } = await this.db
      .from('User')
      .select('id, firstName, lastName')
      .eq('referralCode', code.toUpperCase().trim())
      .single();

    if (!user) return { valid: false };
    return {
      valid: true,
      referrerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'A friend',
    };
  }

  async recordReferral(referralCode: string, refereeEmail: string, refereeId?: string) {
    const { data: referrer } = await this.db
      .from('User')
      .select('*')
      .eq('referralCode', referralCode.toUpperCase().trim())
      .single();

    if (!referrer) {
      this.logger.warn(`Invalid referral code used: ${referralCode}`);
      return null;
    }

    // Block self-referral
    if (referrer.id === refereeId || referrer.email.toLowerCase() === refereeEmail.toLowerCase()) {
      this.logger.warn(`Self-referral blocked: User ${refereeEmail} tried to refer themselves.`);
      return null;
    }

    const { data: existing } = await this.db
      .from('referrals')
      .select('id, status')
      .eq('referrerId', referrer.id)
      .eq('refereeEmail', refereeEmail)
      .single();

    if (existing) {
      const { data, error } = await this.db
        .from('referrals')
        .update({ refereeId, status: refereeId ? 'signed_up' : 'pending' })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;

      if (refereeId) {
        await this.db.from('User').update({ referredById: referrer.id }).eq('id', refereeId);
      }

      return data;
    }

    const { data: referral, error } = await this.db
      .from('referrals')
      .insert({ referrerId: referrer.id, refereeEmail, refereeId, status: refereeId ? 'signed_up' : 'pending' })
      .select()
      .single();
    if (error) throw error;

    if (refereeId) {
      await this.db.from('User').update({ referredById: referrer.id }).eq('id', refereeId);
    }

    return referral;
  }

  async completeReferral(refereeId: string) {
    const { data: referral } = await this.db
      .from('referrals')
      .select('*')
      .eq('refereeId', refereeId)
      .single();

    if (!referral || ['rewarded', 'completed', 'paid'].includes(referral.status)) return null;

    const previousStatus = referral.status;

    // Count how many rewarded/completed referrals this referrer has
    const { data: list } = await this.db
      .from('referrals')
      .select('id')
      .eq('referrerId', referral.referrerId)
      .in('status', ['rewarded', 'completed', 'paid']);

    const rewardedCount = (list || []).length;
    const newRewardedCount = rewardedCount + 1;

    let rewardAmount = 3000;
    let rewardStr = '₹3,000';

    // Milestone bonus logic (10k at 5 successful referrals)
    if (newRewardedCount === 5) {
      rewardAmount += 10000;
      rewardStr = '₹13,000 (includes ₹10,000 bonus)';
    }

    // Update the referral status and reward
    const { data, error } = await this.db
      .from('referrals')
      .update({ 
        status: 'rewarded', 
        completedAt: new Date().toISOString(), 
        reward: rewardStr 
      })
      .eq('id', referral.id)
      .select()
      .single();

    if (error) throw error;

    // Write audit log entry
    await this.logReferralAudit(referral.id, previousStatus, 'rewarded', referral.referrerId, 'System: Automatic reward on loan disbursement');

    // Credit the referrer's wallet balance
    const { data: wallet } = await this.db
      .from('wallets')
      .select('balance')
      .eq('user_id', referral.referrerId)
      .single();

    if (!wallet) {
      await this.db
        .from('wallets')
        .insert({ user_id: referral.referrerId, balance: rewardAmount });
    } else {
      const newBalance = Number(wallet.balance || 0) + rewardAmount;
      await this.db
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', referral.referrerId);
    }

    return data;
  }

  async logReferralAudit(referralId: string, prevStatus: string, newStatus: string, changedBy: string, reason?: string) {
    try {
      await this.db.from('referral_audit_log').insert({
        referralId,
        previousStatus: prevStatus,
        newStatus,
        changedBy,
        reason: reason || null
      });
    } catch (e) {
      console.error(`[ReferralService] Failed to write referral audit log: ${e.message}`);
    }
  }

  async getAdminStats() {
    const [
      { count: totalReferrals },
      { data: paidReferrals },
      { count: pendingPayoutCount }
    ] = await Promise.all([
      this.db.from('referrals').select('*', { count: 'exact', head: true }),
      this.db.from('referrals').select('reward').in('status', ['completed', 'paid']),
      this.db.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'rewarded')
    ]);

    const totalPaid = (paidReferrals || []).reduce((sum: number, r: any) => {
      if (!r.reward) return sum;
      const num = parseInt(r.reward.replace(/[^0-9]/g, ''), 10);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    return {
      totalReferrals: totalReferrals || 0,
      totalPaidOut: totalPaid,
      pendingPayoutCount: pendingPayoutCount || 0
    };
  }

  async getAdminReferrals(statusFilter?: string, search?: string, pendingPayout?: boolean) {
    let query = this.db
      .from('referrals')
      .select('*, referrer:User!referrerId(*), referee:User!refereeId(*)');

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    } else if (pendingPayout) {
      query = query.eq('status', 'rewarded');
    }

    const { data: referrals, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;

    let filtered = referrals || [];
    if (search) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter((r: any) => {
        const referrerName = `${r.referrer?.firstName || ''} ${r.referrer?.lastName || ''}`.toLowerCase();
        const referrerPhone = (r.referrer?.mobile || r.referrer?.phoneNumber || '').toLowerCase();
        const refereeName = `${r.referee?.firstName || ''} ${r.referee?.lastName || ''}`.toLowerCase();
        const refereeEmail = (r.refereeEmail || r.referee?.email || '').toLowerCase();
        return referrerName.includes(term) || referrerPhone.includes(term) || refereeName.includes(term) || refereeEmail.includes(term);
      });
    }

    return filtered.map((r: any) => ({
      id: r.id,
      referrerId: r.referrerId,
      referrerName: r.referrer ? `${r.referrer.firstName || ''} ${r.referrer.lastName || ''}`.trim() : 'Unknown User',
      referrerEmail: r.referrer?.email || '',
      referrerPhone: r.referrer?.mobile || r.referrer?.phoneNumber || '',
      refereeEmail: r.refereeEmail || r.referee?.email || '',
      refereeName: r.referee ? `${r.referee.firstName || ''} ${r.referee.lastName || ''}`.trim() : 'Not Registered',
      refereePhone: r.referee?.mobile || r.referee?.phoneNumber || '',
      status: r.status,
      reward: r.reward,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    }));
  }

  async overrideReferralStatus(referralId: string, status: string, adminId: string, reason?: string) {
    const { data: referral } = await this.db
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (!referral) throw new Error('Referral not found');
    if (referral.status === status) return referral;

    const previousStatus = referral.status;

    const { data: updated, error } = await this.db
      .from('referrals')
      .update({
        status,
        completedAt: ['completed', 'rewarded', 'paid'].includes(status) ? new Date().toISOString() : referral.completedAt
      })
      .eq('id', referralId)
      .select()
      .single();

    if (error) throw error;

    // Log the override audit
    await this.logReferralAudit(referralId, previousStatus, status, adminId, reason || 'Manual admin override');

    // If overridden to rewarded and not previously rewarded, credit wallet
    if (status === 'rewarded' && !['rewarded', 'completed', 'paid'].includes(previousStatus)) {
      const { data: list } = await this.db
        .from('referrals')
        .select('id')
        .eq('referrerId', referral.referrerId)
        .in('status', ['rewarded', 'completed', 'paid']);

      const count = (list || []).length;
      let rewardAmount = 3000;
      if (count === 5) rewardAmount += 10000;

      const { data: wallet } = await this.db
        .from('wallets')
        .select('balance')
        .eq('user_id', referral.referrerId)
        .single();

      if (!wallet) {
        await this.db
          .from('wallets')
          .insert({ user_id: referral.referrerId, balance: rewardAmount });
      } else {
        const newBalance = Number(wallet.balance || 0) + rewardAmount;
        await this.db
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('user_id', referral.referrerId);
      }
    }

    return updated;
  }

  async sendInvite(userId: string, email: string) {
    const { data: user } = await this.db
      .from('User')
      .select('email, referralCode')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found');
    if (user.email === email) throw new Error('You cannot refer yourself');

    const { data: existing } = await this.db
      .from('referrals')
      .select('id')
      .eq('referrerId', userId)
      .eq('refereeEmail', email)
      .single();

    if (existing) throw new Error('You have already invited this person');

    const { data, error } = await this.db
      .from('referrals')
      .insert({ referrerId: userId, refereeEmail: email, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getLeaderboard(limit = 10) {
    const { data: referrals } = await this.db
      .from('referrals')
      .select('referrerId')
      .eq('status', 'completed');

    if (!referrals) return [];

    const counts = new Map<string, number>();
    for (const r of referrals) {
      counts.set(r.referrerId, (counts.get(r.referrerId) || 0) + 1);
    }

    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const leaderboard = await Promise.all(
      sorted.map(async ([referrerId, count], index) => {
        const { data: user } = await this.db
          .from('User')
          .select('firstName, lastName')
          .eq('id', referrerId)
          .single();
        return {
          rank: index + 1,
          name: user ? `${user.firstName || ''} ${user.lastName?.charAt(0) || ''}.`.trim() : 'Anonymous',
          count,
        };
      }),
    );
    return leaderboard;
  }

  private calculateRewards(completedCount: number) {
    const rewards: Array<{ name: string; unlocked: boolean; at?: number }> = [];
    if (completedCount >= 1) rewards.push({ name: '₹500 Cashback', unlocked: true });
    else rewards.push({ name: '₹500 Cashback', unlocked: false, at: 1 });
    if (completedCount >= 3) rewards.push({ name: 'Priority Processing', unlocked: true });
    else rewards.push({ name: 'Priority Processing', unlocked: false, at: 3 });
    if (completedCount >= 5) rewards.push({ name: '0.25% Rate Discount', unlocked: true });
    else rewards.push({ name: '0.25% Rate Discount', unlocked: false, at: 5 });
    if (completedCount >= 7) rewards.push({ name: 'Premium Support', unlocked: true });
    else rewards.push({ name: 'Premium Support', unlocked: false, at: 7 });
    if (completedCount >= 10) rewards.push({ name: 'Diamond Status + ₹5000', unlocked: true });
    else rewards.push({ name: 'Diamond Status + ₹5000', unlocked: false, at: 10 });
    return rewards;
  }

  async recordVisit(code: string, ipAddress?: string, userAgent?: string) {
    const { data: referrer } = await this.db
      .from('User')
      .select('id')
      .eq('referralCode', code.toUpperCase().trim())
      .single();

    const { data } = await this.db.from('ReferralVisit').insert({
      referralCode: code.toUpperCase().trim(),
      ipAddress,
      userAgent,
      referrerId: referrer?.id,
    }).select().single();
    return data;
  }
}

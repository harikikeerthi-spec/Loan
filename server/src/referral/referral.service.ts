import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReferralService {
  private readonly logger = { warn: (m: string) => console.warn(m) };

  private get db() {
    return this.supabase.getClient();
  }

  constructor(private readonly supabase: SupabaseService) {}

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'VL-';
    for (let i = 0; i < 6; i++) {
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

    let code: string = '';
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
      this.db.from('Referral').select('*', { count: 'exact', head: true }).eq('referrerId', userId),
      this.db.from('Referral').select('*', { count: 'exact', head: true }).eq('referrerId', userId).eq('status', 'completed'),
      this.db.from('Referral').select('*', { count: 'exact', head: true }).eq('referrerId', userId).eq('status', 'signed_up'),
      this.db.from('Referral').select('*', { count: 'exact', head: true }).eq('referrerId', userId).eq('status', 'pending'),
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
      .from('Referral')
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

    const { data: existing } = await this.db
      .from('Referral')
      .select('id')
      .eq('referrerId', referrer.id)
      .eq('refereeEmail', refereeEmail)
      .single();

    if (existing) {
      const { data, error } = await this.db
        .from('Referral')
        .update({ refereeId, status: refereeId ? 'signed_up' : 'pending' })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data: referral, error } = await this.db
      .from('Referral')
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
      .from('Referral')
      .select('*')
      .eq('refereeId', refereeId)
      .single();

    if (!referral || referral.status === 'completed') return null;

    const { count: completedCount } = await this.db
      .from('Referral')
      .select('*', { count: 'exact', head: true })
      .eq('referrerId', referral.referrerId)
      .eq('status', 'completed');

    const reward = this.getRewardForCount((completedCount || 0) + 1);

    const { data, error } = await this.db
      .from('Referral')
      .update({ status: 'completed', completedAt: new Date().toISOString(), reward })
      .eq('id', referral.id)
      .select()
      .single();
    if (error) throw error;
    return data;
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
      .from('Referral')
      .select('id')
      .eq('referrerId', userId)
      .eq('refereeEmail', email)
      .single();

    if (existing) throw new Error('You have already invited this person');

    const { data, error } = await this.db
      .from('Referral')
      .insert({ referrerId: userId, refereeEmail: email, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getLeaderboard(limit = 10) {
    // Supabase doesn't support groupBy like Prisma; use RPC or aggregate manually
    const { data: referrals } = await this.db
      .from('Referral')
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

  private getRewardForCount(count: number): string {
    if (count >= 10) return 'diamond';
    if (count >= 7) return 'gold';
    if (count >= 5) return 'silver';
    if (count >= 3) return 'bronze';
    return 'none';
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

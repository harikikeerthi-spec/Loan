import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique referral code for a user
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'VL-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Get or create a referral code for the authenticated user
   */
  async getOrCreateReferralCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.referralCode) {
      return { referralCode: user.referralCode, user };
    }

    // Generate unique code
    let code: string = '';
    let exists = true;
    while (exists) {
      code = this.generateCode();
      const existing = await this.prisma.user.findUnique({
        where: { referralCode: code },
      });
      exists = !!existing;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
      select: { id: true, referralCode: true, firstName: true, lastName: true, email: true },
    });

    return { referralCode: updated.referralCode, user: updated };
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, firstName: true },
    });

    const totalReferrals = await this.prisma.referral.count({
      where: { referrerId: userId },
    });

    const completedReferrals = await this.prisma.referral.count({
      where: { referrerId: userId, status: 'completed' },
    });

    const signedUpReferrals = await this.prisma.referral.count({
      where: { referrerId: userId, status: 'signed_up' },
    });

    const pendingReferrals = await this.prisma.referral.count({
      where: { referrerId: userId, status: 'pending' },
    });

    // Calculate tier
    let tier = 'starter';
    let nextTierAt: number | null = 3;
    if (completedReferrals >= 10) {
      tier = 'diamond';
      nextTierAt = null;
    } else if (completedReferrals >= 7) {
      tier = 'gold';
      nextTierAt = 10;
    } else if (completedReferrals >= 5) {
      tier = 'silver';
      nextTierAt = 7;
    } else if (completedReferrals >= 3) {
      tier = 'bronze';
      nextTierAt = 5;
    }

    // Calculate rewards
    const rewards = this.calculateRewards(completedReferrals);

    return {
      referralCode: user?.referralCode,
      firstName: user?.firstName,
      totalReferrals,
      completedReferrals,
      signedUpReferrals,
      pendingReferrals,
      tier,
      nextTierAt,
      rewards,
    };
  }

  /**
   * Get list of referrals for a user
   */
  async getReferralList(userId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        referee: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return referrals.map((r) => ({
      id: r.id,
      refereeEmail: r.refereeEmail || r.referee?.email,
      refereeName: r.referee
        ? `${r.referee.firstName || ''} ${r.referee.lastName || ''}`.trim()
        : null,
      status: r.status,
      reward: r.reward,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    }));
  }

  /**
   * Validate a referral code and return the referrer info
   */
  async validateReferralCode(code: string) {
    const user = await this.prisma.user.findUnique({
      where: { referralCode: code.toUpperCase().trim() },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!user) {
      return { valid: false };
    }

    return {
      valid: true,
      referrerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'A friend',
    };
  }

  /**
   * Record a referral when someone signs up with a code
   */
  async recordReferral(referralCode: string, refereeEmail: string, refereeId?: string) {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase().trim() },
    });

    if (!referrer) {
      this.logger.warn(`Invalid referral code used: ${referralCode}`);
      return null;
    }

    // Check if referral already exists for this email
    const existing = await this.prisma.referral.findFirst({
      where: { referrerId: referrer.id, refereeEmail },
    });

    if (existing) {
      // Update existing referral
      return this.prisma.referral.update({
        where: { id: existing.id },
        data: {
          refereeId,
          status: refereeId ? 'signed_up' : 'pending',
        },
      });
    }

    const referral = await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeEmail,
        refereeId,
        status: refereeId ? 'signed_up' : 'pending',
      },
    });

    // Update the referee's referredById
    if (refereeId) {
      await this.prisma.user.update({
        where: { id: refereeId },
        data: { referredById: referrer.id },
      });
    }

    return referral;
  }

  /**
   * Complete a referral (e.g. when loan application is submitted)
   */
  async completeReferral(refereeId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { refereeId },
    });

    if (!referral || referral.status === 'completed') {
      return null;
    }

    // Count how many completed referrals the referrer has
    const completedCount = await this.prisma.referral.count({
      where: { referrerId: referral.referrerId, status: 'completed' },
    });

    const reward = this.getRewardForCount(completedCount + 1);

    return this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        reward,
      },
    });
  }

  /**
   * Send a referral invite (record pending referral)
   */
  async sendInvite(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, referralCode: true },
    });

    if (!user) throw new Error('User not found');

    // Don't allow self-referral
    if (user.email === email) {
      throw new Error('You cannot refer yourself');
    }

    // Check if already referred
    const existing = await this.prisma.referral.findFirst({
      where: { referrerId: userId, refereeEmail: email },
    });

    if (existing) {
      throw new Error('You have already invited this person');
    }

    return this.prisma.referral.create({
      data: {
        referrerId: userId,
        refereeEmail: email,
        status: 'pending',
      },
    });
  }

  /**
   * Get leaderboard (top referrers)
   */
  async getLeaderboard(limit = 10) {
    const results = await this.prisma.referral.groupBy({
      by: ['referrerId'],
      where: { status: 'completed' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const leaderboard = await Promise.all(
      results.map(async (r, index) => {
        const user = await this.prisma.user.findUnique({
          where: { id: r.referrerId },
          select: { firstName: true, lastName: true },
        });
        return {
          rank: index + 1,
          name: user
            ? `${user.firstName || ''} ${user.lastName?.charAt(0) || ''}.`.trim()
            : 'Anonymous',
          count: r._count.id,
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
}

import {
  Controller,
  Get,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReferralService } from './referral.service';
import { UserGuard } from '../auth/user.guard';

@Controller('user')
export class UserController {
  constructor(private readonly referralService: ReferralService) {}

  /**
   * GET /user/referral-stats
   * Get referral stats for the current user
   */
  @UseGuards(UserGuard)
  @Get('referral-stats')
  async getReferralStats(@Req() req: any) {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const stats = await this.referralService.getReferralStats(userId);
      
      // Map properties to match frontend expectation if necessary
      return {
        success: true,
        referralCode: stats.referralCode,
        firstName: stats.firstName,
        totalReferrals: stats.totalReferrals,
        completedReferrals: stats.completedReferrals,
        signedUpReferrals: stats.signedUpReferrals,
        pendingReferrals: stats.pendingReferrals,
        totalVisits: stats.totalVisits,
        tier: stats.tier,
        rewards: stats.rewards,
        // Include mappings for checklist:
        clicks: stats.totalVisits,
        registered: stats.signedUpReferrals,
        successful: stats.completedReferrals,
        totalEarned: stats.completedReferrals * 3000,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get referral stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

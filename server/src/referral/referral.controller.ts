import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReferralService } from './referral.service';
import { UserGuard } from '../auth/user.guard';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  /**
   * GET /referral/me
   * Get unified referral data for current user (stats, list, code)
   */
  @UseGuards(UserGuard)
  @Get('me')
  async getMyReferralData(@Req() req: any) {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const codeResult = await this.referralService.getOrCreateReferralCode(userId);
      const stats = await this.referralService.getReferralStats(userId);
      const referrals = await this.referralService.getReferralList(userId);
      return {
        success: true,
        referralCode: codeResult.referralCode,
        stats: {
          ...stats,
          totalEarned: stats.completedReferrals * 3000,
        },
        referrals,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get referral data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /referral/my-code
   * Get or generate the current user's referral code
   */
  @UseGuards(UserGuard)
  @Get('my-code')
  async getMyCode(@Req() req: any) {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const result = await this.referralService.getOrCreateReferralCode(userId);
      return { success: true, code: result.referralCode };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get referral code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /referral/stats
   * Get referral stats for the current user
   */
  @UseGuards(UserGuard)
  @Get('stats')
  async getStats(@Req() req: any) {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const stats = await this.referralService.getReferralStats(userId);
      return { success: true, ...stats };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get referral stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /referral/list
   * Get list of all referrals made by the current user
   */
  @UseGuards(UserGuard)
  @Get('list')
  async getReferralList(@Req() req: any) {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const referrals = await this.referralService.getReferralList(userId);
      return { success: true, referrals };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get referral list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /referral/validate/:code
   * Validate a referral code (public endpoint)
   */
  @Get('validate/:code')
  async validateCode(@Param('code') code: string) {
    try {
      const result = await this.referralService.validateReferralCode(code);
      return { success: true, ...result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to validate referral code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /referral/record
   * Record a referral when someone signs up with a code (called internally during signup)
   */
  @Post('record')
  async recordReferral(
    @Body() body: { referralCode: string; refereeEmail: string; refereeId?: string },
  ) {
    if (!body || !body.referralCode || !body.refereeEmail) {
      return {
        success: false,
        message: 'Referral code and referee email are required',
      };
    }
    try {
      const result = await this.referralService.recordReferral(
        body.referralCode,
        body.refereeEmail,
        body.refereeId,
      );
      return { success: true, referral: result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to record referral',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /referral/invite
   * Send an invite to a friend's email
   */
  @UseGuards(UserGuard)
  @Post('invite')
  async sendInvite(@Req() req: any, @Body() body: { email: string }) {
    if (!body || !body.email) {
      return {
        success: false,
        message: 'Email is required',
      };
    }
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const referral = await this.referralService.sendInvite(userId, body.email);
      return { success: true, referral };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send invite',
        error.message?.includes('already') ? HttpStatus.CONFLICT : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /referral/leaderboard
   * Get top referrers leaderboard
   */
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    try {
      const leaderboard = await this.referralService.getLeaderboard(
        limit ? parseInt(limit, 10) : 10,
      );
      return { success: true, leaderboard };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get leaderboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /referral/visit/:code
   * Record a click/visit on a referral link (public endpoint)
   */
  @Post('visit/:code')
  async recordVisit(
    @Param('code') code: string,
    @Req() req: any,
  ) {
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      await this.referralService.recordVisit(code, ip, userAgent);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  /**
   * GET /referral/admin/stats
   * Get stats for admin dashboard
   */
  @UseGuards(UserGuard)
  @Get('admin/stats')
  async getAdminStats(@Req() req: any) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
    try {
      const stats = await this.referralService.getAdminStats();
      return { success: true, stats };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get admin stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /referral/admin/list
   * Get list of all referrals with status filters, search term, and pending payout filter
   */
  @UseGuards(UserGuard)
  @Get('admin/list')
  async getAdminList(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('pendingPayout') pendingPayout?: string,
  ) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
    try {
      const referrals = await this.referralService.getAdminReferrals(
        status,
        search,
        pendingPayout === 'true',
      );
      return { success: true, referrals };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get admin referrals list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PATCH /referral/admin/override/:id
   * Override referral status (writes an audit log and credits wallet if status becomes rewarded)
   */
  @UseGuards(UserGuard)
  @Patch('admin/override/:id')
  async overrideStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
  ) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
    if (!body || !body.status) {
      throw new HttpException('Status is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const adminId = req.user?.sub || req.user?.id;
      const updated = await this.referralService.overrideReferralStatus(
        id,
        body.status,
        adminId,
        body.reason,
      );
      return { success: true, referral: updated };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to override referral status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

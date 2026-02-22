import {
  Controller,
  Get,
  Post,
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
      return { success: true, ...result };
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
}

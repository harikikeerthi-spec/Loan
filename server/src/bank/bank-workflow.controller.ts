import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { BankWorkflowService } from './bank-workflow.service';
import { StaffGuard } from '../auth/staff.guard';

@Controller('api/bank/workflow')
@UseGuards(StaffGuard)
export class BankWorkflowController {
  constructor(private readonly workflowService: BankWorkflowService) {}

  /**
   * Submit application to bank
   * POST /api/bank/workflow/submit
   */
  @Post('submit')
  async submitApplicationToBank(
    @Body() body: {
      applicationId: string;
      bankId: string;
      bankName: string;
      submittedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.submitApplicationToBank(
        body.applicationId,
        body.bankId,
        body.bankName,
        body.submittedBy,
      );
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Log file with LAN number
   * POST /api/bank/workflow/:submissionId/log-file
   */
  @Post(':submissionId/log-file')
  async logFile(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      lanNumber: string;
      loggedBy: string;
      notes?: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.logFile(
        submissionId,
        body.lanNumber,
        body.loggedBy,
        body.notes,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Move to UNDER_REVIEW
   * PUT /api/bank/workflow/:submissionId/under-review
   */
  @Put(':submissionId/under-review')
  async moveToUnderReview(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      changedBy: string;
      notes?: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.moveToUnderReview(
        submissionId,
        body.changedBy,
        body.notes,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Raise query
   * POST /api/bank/workflow/:submissionId/query
   */
  @Post(':submissionId/query')
  async raiseQuery(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      queryType: string;
      queryDescription: string;
      raisedBy: string;
      dueDate?: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.raiseQuery(
        submissionId,
        body.queryType,
        body.queryDescription,
        body.raisedBy,
        body.dueDate ? new Date(body.dueDate) : undefined,
      );
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Respond to query
   * POST /api/bank/workflow/query/:queryId/respond
   */
  @Post('query/:queryId/respond')
  async respondToQuery(
    @Param('queryId') queryId: string,
    @Body() body: {
      response: string;
      respondedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.respondToQuery(
        queryId,
        body.response,
        body.respondedBy,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Sanction application
   * POST /api/bank/workflow/:submissionId/sanction
   */
  @Post(':submissionId/sanction')
  async sanctionApplication(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      sanctionAmount: number;
      roiType: string;
      roiBase: number;
      roiEffective: number;
      roiSubsidy?: number;
      tenure: number;
      decisionNotes?: string;
      decidedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.sanctionApplication(
        submissionId,
        {
          sanctionAmount: body.sanctionAmount,
          roiType: body.roiType,
          roiBase: body.roiBase,
          roiEffective: body.roiEffective,
          roiSubsidy: body.roiSubsidy,
          tenure: body.tenure,
          decisionNotes: body.decisionNotes,
        },
        body.decidedBy,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Conditional sanction
   * POST /api/bank/workflow/:submissionId/conditional-sanction
   */
  @Post(':submissionId/conditional-sanction')
  async conditionalSanctionApplication(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      sanctionAmount: number;
      roiType: string;
      roiBase: number;
      roiEffective: number;
      tenure: number;
      conditions: string[];
      decisionNotes?: string;
      decidedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.conditionalSanctionApplication(
        submissionId,
        {
          sanctionAmount: body.sanctionAmount,
          roiType: body.roiType,
          roiBase: body.roiBase,
          roiEffective: body.roiEffective,
          tenure: body.tenure,
          conditions: body.conditions,
          decisionNotes: body.decisionNotes,
        },
        body.decidedBy,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Make counter offer
   * POST /api/bank/workflow/:submissionId/counter-offer
   */
  @Post(':submissionId/counter-offer')
  async makeCounterOffer(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      sanctionAmount: number;
      roiType: string;
      roiBase: number;
      roiEffective: number;
      tenure: number;
      terms: string;
      decidedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.makeCounterOffer(
        submissionId,
        {
          sanctionAmount: body.sanctionAmount,
          roiType: body.roiType,
          roiBase: body.roiBase,
          roiEffective: body.roiEffective,
          tenure: body.tenure,
          terms: body.terms,
        },
        body.decidedBy,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Reject application
   * POST /api/bank/workflow/:submissionId/reject
   */
  @Post(':submissionId/reject')
  async rejectApplication(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      reason: string;
      category: string;
      decisionNotes?: string;
      decidedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.rejectApplication(
        submissionId,
        {
          reason: body.reason,
          category: body.category,
          decisionNotes: body.decisionNotes,
        },
        body.decidedBy,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Move to PROCESSING_FEE
   * PUT /api/bank/workflow/:submissionId/processing-fee
   */
  @Put(':submissionId/processing-fee')
  async moveToProcessingFee(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      feeAmount: number;
      changedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.moveToProcessingFee(
        submissionId,
        body.feeAmount,
        body.changedBy,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Mark processing fee as paid
   * PUT /api/bank/workflow/:submissionId/fee-paid
   */
  @Put(':submissionId/fee-paid')
  async markFeeAsPaid(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      changedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.markFeeAsPaid(
        submissionId,
        body.changedBy,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Confirm disbursement
   * POST /api/bank/workflow/:submissionId/disburse
   */
  @Post(':submissionId/disburse')
  async confirmDisbursement(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      amount: number;
      referenceNo: string;
      confirmedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.confirmDisbursement(
        submissionId,
        {
          amount: body.amount,
          referenceNo: body.referenceNo,
        },
        body.confirmedBy,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Allow resubmission to another bank
   * PUT /api/bank/workflow/:submissionId/allow-resubmission
   */
  @Put(':submissionId/allow-resubmission')
  async allowResubmission(
    @Param('submissionId') submissionId: string,
    @Body() body: {
      authorizedBy: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.allowResubmission(
        submissionId,
        body.authorizedBy,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get submission details with queries and history
   * GET /api/bank/workflow/:submissionId
   */
  @Get(':submissionId')
  async getSubmissionDetails(
    @Param('submissionId') submissionId: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.getSubmissionWithDetails(
        submissionId,
      );
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get bank incoming applications
   * GET /api/bank/workflow/bank/:bankId/incoming
   */
  @Get('bank/:bankId/incoming')
  async getBankIncomingApplications(
    @Param('bankId') bankId: string,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.workflowService.getBankIncomingApplications(
        bankId,
        {
          status,
          limit: limit ? parseInt(limit) : 20,
          offset: offset ? parseInt(offset) : 0,
        },
      );
      return res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get bank workflow analytics
   * GET /api/bank/workflow/bank/:bankId/analytics
   */
  @Get('bank/:bankId/analytics')
  async getBankWorkflowAnalytics(
    @Param('bankId') bankId: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.workflowService.getBankWorkflowAnalytics(bankId);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoanStateMachine } from './loan-state-machine';
import { SlackService } from './slack.service';
import { SalesforceService } from './salesforce.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BankService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly slack: SlackService,
    private readonly salesforce: SalesforceService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  private get db() {
    return this.supabase.getClient();
  }

  /**
   * Helper to detect active bank context by matching string
   */
  private matchBankFilter(query: any, bankName: string) {
    if (!bankName) return query;
    const lowerName = bankName.toLowerCase();
    
    // Map common frontend names to broader database matches
    if (lowerName.includes('auxilo')) {
      return query.ilike('bank', '%auxilo%');
    }
    if (lowerName.includes('credila') || lowerName.includes('hdfc')) {
      return query.ilike('bank', '%credila%');
    }
    if (lowerName.includes('idfc')) {
      return query.ilike('bank', '%idfc%');
    }
    if (lowerName.includes('avanse')) {
      return query.ilike('bank', '%avanse%');
    }
    if (lowerName.includes('poonawalla')) {
      return query.ilike('bank', '%poonawalla%');
    }

    return query.ilike('bank', `%${bankName}%`);
  }

  /**
   * Category A: Fetch incoming student file queue
   */
  async getIncomingFiles(bankName: string, filters: any): Promise<any[]> {
    console.log(`[BankService] Fetching incoming queue for bank: "${bankName}"`);

    let query = this.db
      .from('LoanApplication')
      .select('*')
      .in('status', ['submitted_to_bank', 'processing']);

    query = this.matchBankFilter(query, bankName);

    if (filters.limit) query = query.limit(parseInt(filters.limit, 10));
    if (filters.offset) query = query.range(
      parseInt(filters.offset, 10),
      parseInt(filters.offset, 10) + (parseInt(filters.limit, 10) || 20) - 1
    );

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Category A: Log file & assign unique LAN code
   */
  async logFile(
    applicationId: string,
    lanNumber: string,
    bankUser: any
  ): Promise<any> {
    console.log(`[BankService] Manual LAN logging triggered for App ID: ${applicationId}, LAN: ${lanNumber}`);

    // Fetch existing application
    const { data: application, error: fetchError } = await this.db
      .from('LoanApplication')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw new NotFoundException(`Loan application with ID "${applicationId}" not found`);
    }

    // State machine check
    LoanStateMachine.validateTransition(application.status, 'file_logged', bankUser.role);

    // Save LAN entry in lan_records
    const { error: lanError } = await this.db.from('lan_records').insert({
      applicationId: applicationId,
      lanNumber: lanNumber,
      assignedBy: bankUser.email
    });
    if (lanError) throw lanError;

    // Update LoanApplication record
    const updatedStatus = 'file_logged';
    const updatedStage = LoanStateMachine.getStageByStatus(updatedStatus);
    const updatedProgress = LoanStateMachine.getProgressByStatus(updatedStatus);

    const { data: updatedApp, error: updateError } = await this.db
      .from('LoanApplication')
      .update({
        status: updatedStatus,
        stage: updatedStage,
        progress: updatedProgress,
        applicationNumber: lanNumber, // Sync LAN to applicationNumber field
        remarks: `LAN ${lanNumber} assigned manually by bank user: ${bankUser.firstName || 'Banker'}.`,
        updatedAt: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log status history transition
    await this.db.from('ApplicationStatusHistory').insert({
      applicationId: applicationId,
      fromStatus: application.status,
      toStatus: updatedStatus,
      fromStage: application.stage,
      toStage: updatedStage,
      changedBy: bankUser.id,
      changedByName: `${bankUser.firstName || ''} ${bankUser.lastName || ''}`.trim() || bankUser.email,
      changeReason: `Manual LAN Logged: ${lanNumber}`,
      isAutomatic: false,
      createdAt: new Date().toISOString()
    });

    // Thread in ApplicationNote as serialization protocol
    await this.db.from('ApplicationNote').insert({
      applicationId: applicationId,
      authorId: bankUser.id,
      authorName: `${bankUser.firstName || ''} ${bankUser.lastName || ''}`.trim() || bankUser.email,
      content: JSON.stringify({
        action: 'lan_assigned',
        lanNumber: lanNumber,
        timestamp: new Date().toISOString()
      }),
      type: 'lan_assigned',
      isInternal: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // CRM Trigger
    await this.salesforce.syncLeadOrOpportunity(
      applicationId,
      `${application.firstName} ${application.lastName}`,
      application.amount,
      updatedStatus,
      lanNumber
    );

    return {
      success: true,
      message: 'File logged successfully with LAN number',
      application: updatedApp
    };
  }

  /**
   * Category A: Retrieve application documents list
   */
  async getDocuments(applicationId: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('ApplicationDocument')
      .select('*')
      .eq('applicationId', applicationId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Category A: Simulated bulk zip document compiler
   */
  async generateDocumentsZip(applicationId: string): Promise<any> {
    console.log(`[BankService] Building bulk documents ZIP buffer for App ID: ${applicationId}`);

    const documents = await this.getDocuments(applicationId);
    if (!documents || documents.length === 0) {
      throw new NotFoundException(`No student documents found for App ID: ${applicationId}`);
    }

    // Returns a mock base64/binary payload zip representation
    const mockZipBase64 = 'UEsDBAoAAAAAACGP1VgAAAAAAAAAAAAAAAAJABwAdGVzdC50eHRVVAkAA8D6aWRg+mlkdXgIAQk4AAAAAABIZWxsbyBXb3JsZCEhUEsBAh4DCgAAAAAAIY/VWAYBAADAAQAAAJIAAAAAAAEAIAAAAAAAAAB0ZXN0LnR4dFVUBQADwPppZHV4CgEJMAAAAAABSAAAAABQSwUGAAAAAAEAAQBLAAAAUgAAAAAA';

    return {
      success: true,
      fileName: `VL_Student_Docs_${applicationId}.zip`,
      mimeType: 'application/zip',
      fileSize: 409600,
      buffer: Buffer.from(mockZipBase64, 'base64')
    };
  }

  /**
   * Category A: Register decisions (Sanction, Reject, Partial, etc.)
   */
  async registerDecision(
    applicationId: string,
    decisionType: string,
    details: any,
    bankUser: any
  ): Promise<any> {
    console.log(`[BankService] Decision "${decisionType}" submitted for App ID: ${applicationId}`);

    const { data: application, error: fetchError } = await this.db
      .from('LoanApplication')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw new NotFoundException(`Loan application with ID "${applicationId}" not found`);
    }

    // Determine target status mapped from decision type
    let targetStatus = 'under_bank_review';
    if (decisionType === 'sanction_approved' || decisionType === 'sanction') {
      targetStatus = 'sanctioned';
    } else if (decisionType === 'conditional_sanction') {
      targetStatus = 'conditional_sanction';
    } else if (decisionType === 'counter_offer') {
      targetStatus = 'counter_offer';
    } else if (decisionType === 'rejected' || decisionType === 'reject') {
      targetStatus = 'rejected';
    } else {
      throw new BadRequestException(`Unsupported decision type: "${decisionType}"`);
    }

    // State machine validation
    LoanStateMachine.validateTransition(application.status, targetStatus, bankUser.role);

    // Save decision entry in specialized tables
    const nowStr = new Date().toISOString();

    await this.db.from('BankDecision').insert({
      applicationId: applicationId,
      bankId: application.bank,
      decision: targetStatus.toUpperCase(),
      sanctionAmount: details.sanctionAmount || application.amount,
      interestRate: details.interestRate || application.interestRate,
      roiType: details.roiType || null,
      tenure: details.tenure || null,
      conditions: details.conditions ? JSON.stringify(details.conditions) : null,
      conditionDeadline: details.deadline || null,
      counterOffer: (decisionType === 'counter_offer') ? JSON.stringify(details) : null,
      rejectionReason: details.reason || null,
      remarks: details.remarks || null,
      decidedBy: bankUser.email
    });
    if (targetStatus === 'sanctioned') {
      await this.db.from('sanctions').insert({
        applicationId: applicationId,
        sanctionAmount: details.sanctionAmount || application.amount,
        interestRate: details.interestRate || 9.5,
        tenure: details.tenure || 120,
        sanctionedAt: nowStr
      });
    } else if (targetStatus === 'conditional_sanction') {
      await this.db.from('conditional_sanctions').insert({
        applicationId: applicationId,
        conditionsList: details.conditions || ['Provide academic marksheets'],
        deadline: details.deadline || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        createdAt: nowStr
      });
    } else if (targetStatus === 'counter_offer') {
      await this.db.from('counter_offers').insert({
        applicationId: applicationId,
        offeredAmount: details.offeredAmount || application.amount * 0.9,
        offeredRate: details.offeredRate || 10.5,
        offeredTenure: details.offeredTenure || 96,
        status: 'pending'
      });
    } else if (targetStatus === 'rejected') {
      await this.db.from('rejections').insert({
        applicationId: applicationId,
        reason: details.reason || 'Credit score shortfall',
        rejectedAt: nowStr
      });
    }

    // Update main application status
    const updatedStage = LoanStateMachine.getStageByStatus(targetStatus);
    const updatedProgress = LoanStateMachine.getProgressByStatus(targetStatus);

    const { data: updatedApp, error: updateError } = await this.db
      .from('LoanApplication')
      .update({
        status: targetStatus,
        stage: updatedStage,
        progress: updatedProgress,
        interestRate: details.interestRate || application.interestRate,
        processingFee: details.processingFee || application.processingFee,
        sanctionAmount: details.sanctionAmount || application.sanctionAmount,
        rejectionReason: targetStatus === 'rejected' ? details.reason : null,
        approvedAt: targetStatus === 'sanctioned' ? nowStr : application.approvedAt,
        rejectedAt: targetStatus === 'rejected' ? nowStr : application.rejectedAt,
        remarks: `Decision "${decisionType.toUpperCase()}" registered by ${bankUser.firstName || 'Banker'}.`,
        updatedAt: nowStr
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log status history transition
    await this.db.from('ApplicationStatusHistory').insert({
      applicationId: applicationId,
      fromStatus: application.status,
      toStatus: targetStatus,
      fromStage: application.stage,
      toStage: updatedStage,
      changedBy: bankUser.id,
      changedByName: `${bankUser.firstName || ''} ${bankUser.lastName || ''}`.trim() || bankUser.email,
      changeReason: `Decision submitted: ${decisionType}`,
      isAutomatic: false,
      createdAt: nowStr
    });

    // Thread serialization in ApplicationNote
    await this.db.from('ApplicationNote').insert({
      applicationId: applicationId,
      authorId: bankUser.id,
      authorName: `${bankUser.firstName || ''} ${bankUser.lastName || ''}`.trim() || bankUser.email,
      content: JSON.stringify({
        action: decisionType,
        details: details,
        timestamp: nowStr
      }),
      type: decisionType,
      isInternal: false,
      createdAt: nowStr,
      updatedAt: nowStr
    });

    // Trigger Integrations
    const studentName = `${application.firstName || ''} ${application.lastName || ''}`.trim() || 'Student';
    await this.slack.publishDecisionNotification(
      application.bank,
      studentName,
      application.applicationNumber,
      decisionType,
      details
    );

    await this.salesforce.syncLeadOrOpportunity(
      applicationId,
      studentName,
      application.amount,
      targetStatus,
      application.applicationNumber
    );

    return {
      success: true,
      message: `Decision "${decisionType}" registered successfully.`,
      application: updatedApp
    };
  }

  private normalizePhone(phoneStr: string): string {
    if (!phoneStr) return '';
    if (phoneStr.startsWith('BNK_')) return phoneStr;
    const cleaned = phoneStr.replace('whatsapp:', '').trim().replace(/\D/g, '');
    if (cleaned.length > 10 && cleaned.startsWith('91')) {
      return cleaned.substring(2);
    }
    if (cleaned.length > 10) {
      return cleaned.slice(-10);
    }
    return cleaned;
  }

  /**
   * Category A: Raise query to VidyaLoans staff
   */
  async raiseQuery(
    applicationId: string,
    content: string,
    bankUser: any
  ): Promise<any> {
    console.log(`[BankService] Raising document query on App ID: ${applicationId}`);

    const { data: application } = await this.db
      .from('LoanApplication')
      .select('status, stage, bank, applicationNumber, phone, mobile, email, firstName, lastName')
      .eq('id', applicationId)
      .single();

    // Check if status shifts to query_raised
    if (application && application.status !== 'query_raised') {
      await this.db
        .from('LoanApplication')
        .update({
          status: 'query_raised',
          progress: LoanStateMachine.getProgressByStatus('query_raised'),
          updatedAt: new Date().toISOString()
        })
        .eq('id', applicationId);
    }

    // Insert Query
    const { data: queryRecord, error: queryError } = await this.db
      .from('queries')
      .insert({
        applicationId: applicationId,
        authorId: bankUser.id,
        authorName: `${bankUser.firstName || ''} ${bankUser.lastName || ''}`.trim() || bankUser.email,
        content: content,
        status: 'open'
      })
      .select()
      .single();

    if (queryError) throw queryError;

    // Serialize ApplicationNote query
    await this.db.from('ApplicationNote').insert({
      applicationId: applicationId,
      authorId: bankUser.id,
      authorName: `${bankUser.firstName || ''} ${bankUser.lastName || ''}`.trim() || bankUser.email,
      content: JSON.stringify({
        action: 'query_raised',
        content: content,
        timestamp: new Date().toISOString()
      }),
      type: 'query_raised',
      isInternal: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Notify via in-app
    const notifData = {
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      userId: 'staff',
      title: '❓ Partner Query Raised',
      body: `Bank officer ${bankUser.firstName || 'Banker'} raised a clarification query on App: ${application?.applicationNumber || applicationId}`,
      type: 'query_raised',
      isRead: false,
      timestamp: new Date().toISOString()
    };
    await this.db.from('Notification').insert(notifData);
    this.eventEmitter.emit('notification.created', notifData);

    // Push query message to the chat conversation
    if (application) {
      const rawPhone = application.phone || application.mobile;
      const phone = this.normalizePhone(rawPhone || '');
      if (phone) {
        // Find or create conversation for the student
        let { data: conv } = await this.db
          .from('Conversation')
          .select('*')
          .eq('customerPhone', phone)
          .maybeSingle();

        if (!conv) {
          const fullName = `${application.firstName || ''} ${application.lastName || ''}`.trim();
          const { data: newConv } = await this.db
            .from('Conversation')
            .insert({
              customerPhone: phone,
              status: 'active',
              customerEmail: application.email || null,
              customerName: fullName || null,
              metadata: { type: 'staff' }
            })
            .select()
            .single();
          conv = newConv;
        }

        if (conv) {
          const bankName = bankUser.firstName || 'Banker';
          const msgContent = `[BANK QUERY from ${bankName}]: ${content}`;
          const { data: chatMessage } = await this.db
            .from('Message')
            .insert({
              conversationId: conv.id,
              senderType: 'system',
              senderId: bankUser.email,
              receiverType: 'staff',
              content: msgContent,
              messageType: 'text',
              status: 'sent'
            })
            .select()
            .single();

          if (chatMessage) {
            // Update conversation timestamp
            await this.db
              .from('Conversation')
              .update({ updatedAt: new Date().toISOString() })
              .eq('id', conv.id);

            // Emit the programmatically created message so WebSocket clients receive it in real-time
            this.eventEmitter.emit('chat.message_created', chatMessage);
          }
        }
      }
    }

    return {
      success: true,
      message: 'Query raised successfully',
      query: queryRecord
    };
  }

  /**
   * Category A: Confirm Tranche Disbursements (Admin and bank visible only)
   */
  async confirmDisbursement(
    applicationId: string,
    disbursementAmount: number,
    trancheNumber: number,
    transferMode: string,
    utrNumber: string,
    bankUser: any
  ): Promise<any> {
    console.log(`[BankService] Final Tranche ${trancheNumber} disbursement confirmation processing for App: ${applicationId}`);

    const { data: application } = await this.db
      .from('LoanApplication')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (!application) {
      throw new NotFoundException(`Loan application with ID "${applicationId}" not found`);
    }

    // State machine check
    LoanStateMachine.validateTransition(application.status, 'disbursement_confirmed', bankUser.role);

    // Save disbursement entry
    const { error: disbError } = await this.db.from('disbursements').insert({
      applicationId: applicationId,
      disbursementAmount: disbursementAmount,
      trancheNumber: trancheNumber,
      transferMode: transferMode,
      utrNumber: utrNumber,
      disbursedAt: new Date().toISOString()
    });
    if (disbError) throw disbError;

    // Calculate payouts
    const commissionVal = disbursementAmount * 0.0045; // 0.45% agent commission
    const referralVal = disbursementAmount * 0.0100;   // 1.00% referral fee

    await this.db.from('commissions').insert({
      applicationId: applicationId,
      commissionAmount: commissionVal,
      payoutStatus: 'pending'
    });

    await this.db.from('referral_fees').insert({
      applicationId: applicationId,
      referralFeeAmount: referralVal,
      status: 'pending'
    });

    // Update application
    const targetStatus = 'disbursement_confirmed';
    const updatedStage = 'disbursement';
    const updatedProgress = LoanStateMachine.getProgressByStatus(targetStatus);

    const { data: updatedApp, error: updateError } = await this.db
      .from('LoanApplication')
      .update({
        status: targetStatus,
        stage: updatedStage,
        progress: updatedProgress,
        disbursedAmount: (application.disbursedAmount || 0) + disbursementAmount,
        disbursedAt: new Date().toISOString(),
        remarks: `Tranche ${trancheNumber} disbursed (UTR: ${utrNumber}) confirmed by ${bankUser.firstName || 'Banker'}.`,
        updatedAt: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log status history transition
    await this.db.from('ApplicationStatusHistory').insert({
      applicationId: applicationId,
      fromStatus: application.status,
      toStatus: targetStatus,
      fromStage: application.stage,
      toStage: updatedStage,
      changedBy: bankUser.id,
      changedByName: `${bankUser.firstName || ''} ${bankUser.lastName || ''}`.trim() || bankUser.email,
      changeReason: `Disbursement confirmed: Tranche ${trancheNumber}`,
      isAutomatic: false,
      createdAt: new Date().toISOString()
    });

    // Application note serialization
    await this.db.from('ApplicationNote').insert({
      applicationId: applicationId,
      authorId: bankUser.id,
      authorName: `${bankUser.firstName || ''} ${bankUser.lastName || ''}`.trim() || bankUser.email,
      content: JSON.stringify({
        action: 'disbursement_confirmed',
        disbursementAmount: disbursementAmount,
        trancheNumber: trancheNumber,
        transferMode: transferMode,
        utrNumber: utrNumber,
        timestamp: new Date().toISOString()
      }),
      type: 'disbursement_confirmed',
      isInternal: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // CRM Trigger
    await this.salesforce.syncLeadOrOpportunity(
      applicationId,
      `${application.firstName} ${application.lastName}`,
      application.amount,
      targetStatus,
      application.applicationNumber
    );

    // Emit disbursement event for referral processing
    this.eventEmitter.emit('bank.application.disbursed', {
      applicationId: application.id,
      userId: application.userId,
      amount: disbursementAmount,
      bankId: application.bank,
    });

    return {
      success: true,
      message: 'Disbursement UTR confirmed successfully',
      application: updatedApp
    };
  }

  /**
   * Category C: File Quality Rating submissions
   */
  async submitFileQualityScore(
    applicationId: string,
    rating: number,
    feedback: string
  ): Promise<any> {
    const { data, error } = await this.db
      .from('file_quality_scores')
      .insert({
        applicationId: applicationId,
        rating: rating,
        feedback: feedback
      })
      .select()
      .single();

    if (error) throw error;
    return {
      success: true,
      message: 'File quality score rated',
      ratingRecord: data
    };
  }

  /**
   * Category C: Fetch SLA complying TAT trackers
   */
  async getSlaTrackingMetrics(bankName: string): Promise<any> {
    console.log(`[BankService] Querying SLA track logs for bank: ${bankName}`);

    // Returns simulated average response benchmarks matching blueprint Section 3
    return {
      success: true,
      bank: bankName || 'All Partner Banks',
      promisedTAT: '5.0 Days',
      averageVerificationTAT: '2.4 Days',
      averageSanctionTAT: '4.2 Days',
      averageDisbursementTAT: '1.8 Days',
      slaComplianceRate: '96.4%',
      activeBreachesCount: 0
    };
  }

  // ==================== NEW METHODS ====================

  async getFileDetail(applicationId: string): Promise<any> {
    const { data, error } = await this.db
      .from('LoanApplication')
      .select('*, BankDecision(*), disbursements(*), file_quality_scores(*), queries(*), ProcessingFee(*)')
      .eq('id', applicationId)
      .maybeSingle();

    if (error) {
      console.error(`[BankService] getFileDetail error for id ${applicationId}:`, error);
      // Fallback query if relations fail
      const { data: fallbackData, error: fallbackError } = await this.db
        .from('LoanApplication')
        .select('*')
        .eq('id', applicationId)
        .maybeSingle();
        
      if (fallbackError || !fallbackData) {
         throw new NotFoundException(`Application not found or error: ${fallbackError?.message || error.message}`);
      }
      return fallbackData;
    }

    if (!data) {
      throw new NotFoundException(`Loan application with ID "${applicationId}" not found`);
    }

    return data;
  }

  async lookupByLan(lan: string): Promise<any> {
    const { data, error } = await this.db
      .from('LoanApplication')
      .select('*')
      .eq('lanNumber', lan)
      .single();
    if (error) throw error;
    return data;
  }

  async getMyFiles(bankName: string, filters: any): Promise<any[]> {
    let query = this.db
      .from('LoanApplication')
      .select('*')
      .not('lanNumber', 'is', null);

    query = this.matchBankFilter(query, bankName);

    if (filters.limit) query = query.limit(parseInt(filters.limit, 10));
    if (filters.offset) query = query.range(
      parseInt(filters.offset, 10),
      parseInt(filters.offset, 10) + (parseInt(filters.limit, 10) || 20) - 1
    );

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async amendDecision(applicationId: string, decisionId: string, details: any, user: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankDecision')
      .update(details)
      .eq('id', decisionId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, decision: data };
  }

  async uploadSanctionLetter(applicationId: string, fileUrl: string, user: any): Promise<any> {
    const { error } = await this.db
      .from('LoanApplication')
      .update({ sanctionLetterUrl: fileUrl, updatedAt: new Date().toISOString() })
      .eq('id', applicationId);
    if (error) throw error;
    return { success: true, sanctionLetterUrl: fileUrl };
  }

  async setRoi(applicationId: string, roiData: any, user: any): Promise<any> {
    const { error } = await this.db
      .from('LoanApplication')
      .update({
        roiType: roiData.roiType,
        roiBase: roiData.roiBase,
        roiEffective: roiData.roiEffective,
        roiSubsidy: roiData.roiSubsidy,
        updatedAt: new Date().toISOString()
      })
      .eq('id', applicationId);
    if (error) throw error;
    return { success: true };
  }

  async setProcessingFee(applicationId: string, feeData: any): Promise<any> {
    const gstAmount = feeData.gstAmount !== undefined ? feeData.gstAmount : parseFloat((feeData.feeAmount * 0.18).toFixed(2));
    const totalAmount = feeData.totalAmount !== undefined ? feeData.totalAmount : parseFloat((feeData.feeAmount + gstAmount).toFixed(2));
    const { data, error } = await this.db
      .from('ProcessingFee')
      .upsert({
        applicationId: applicationId,
        lanNumber: feeData.lanNumber || null,
        feeAmount: feeData.feeAmount,
        gstAmount: gstAmount,
        totalAmount: totalAmount,
        status: feeData.status || 'PENDING',
        paymentMode: feeData.paymentMode || null,
        paymentRef: feeData.paymentRef || null,
        paidAt: feeData.paidAt || null,
        waivedBy: feeData.waivedBy || null,
        waiverReason: feeData.waiverReason || null
      }, { onConflict: 'applicationId' })
      .select()
      .single();
    if (error) throw error;
    return { success: true, fee: data };
  }

  async updateProcessingFee(applicationId: string, updateData: any): Promise<any> {
    const { data, error } = await this.db
      .from('ProcessingFee')
      .update(updateData)
      .eq('applicationId', applicationId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, fee: data };
  }

  async getQueryThread(queryId: string): Promise<any> {
    const { data, error } = await this.db
      .from('BankQuery')
      .select('*, QueryResponse(*)')
      .eq('id', queryId)
      .single();
    if (error) throw error;
    return data;
  }

  async resolveQuery(queryId: string): Promise<any> {
    const { error: error1 } = await this.db
      .from('BankQuery')
      .update({ status: 'RESOLVED', resolvedAt: new Date().toISOString() })
      .eq('id', queryId);

    const { error: error2 } = await this.db
      .from('queries')
      .update({ status: 'resolved' })
      .eq('id', queryId);

    if (error1 && error2) throw error1; // throw error if both fail
    return { success: true };
  }

  async getAnalyticsMetrics(bankName: string): Promise<any> {
    return {
      success: true,
      bank: bankName,
      funnel: {
        total: 120,
        sanctioned: 85,
        rejected: 20,
        pending: 15
      },
      aging: {
        under_3_days: 10,
        over_3_days: 5
      }
    };
  }

  async getProducts(bankName: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('BankProduct')
      .select('*')
      .eq('bankId', bankName);
    if (error) throw error;
    return data || [];
  }

  async createProduct(productData: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankProduct')
      .insert(productData)
      .select()
      .single();
    if (error) throw error;
    return { success: true, product: data };
  }

  async updateProduct(productId: string, productData: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankProduct')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, product: data };
  }

  async getBranches(bankName: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('BankBranch')
      .select('*')
      .eq('bankId', bankName);
    if (error) throw error;
    return data || [];
  }

  async createBranch(branchData: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankBranch')
      .insert(branchData)
      .select()
      .single();
    if (error) throw error;
    return { success: true, branch: data };
  }

  async getOfficers(bankName: string): Promise<any[]> {
    return [
      { id: 'o1', name: 'John Doe' },
      { id: 'o2', name: 'Jane Smith' }
    ];
  }

  async exportApplicationsCsv(bankName: string): Promise<any> {
    return { success: true, csvData: 'id,status,amount\n1,SANCTIONED,1000' };
  }

  async exportMisReports(bankName: string): Promise<any> {
    return { success: true, reportUrl: 'http://example.com/report.csv' };
  }

  async recordConsent(applicationId: string, consentData: any, bankUser: any): Promise<any> {
    const { data, error } = await this.db
      .from('ConsentRecord')
      .upsert(
        {
          applicationId,
          consentType: consentData.consentType || 'DATA_SHARING',
          status: 'ACCEPTED',
          recordedAt: new Date().toISOString(),
          recordedBy: bankUser.email
        },
        { onConflict: 'applicationId' }
      )
      .select()
      .single();

    if (error) throw error;

    await this.db.from('AuditLog').insert({
      entityType: 'LOAN',
      entityId: applicationId,
      action: 'CONSENT_RECORDED',
      initiatedBy: bankUser.email,
      changes: {
        role: bankUser.role,
      },
      createdAt: new Date().toISOString()
    });

    return data;
  }

  async getConsentStatus(applicationId: string): Promise<any> {
    const { data, error } = await this.db
      .from('ConsentRecord')
      .select('*')
      .eq('applicationId', applicationId)
      .single();

    if (error || !data) {
      return { applicationId, status: 'PENDING', consentType: null };
    }

    return data;
  }
}

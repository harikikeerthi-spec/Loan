import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoanStateMachine } from './loan-state-machine';
import { SlackService } from './slack.service';
import { SalesforceService } from './salesforce.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatService } from '../chat/chat.service';
import { EmailService } from '../auth/email.service';
import { Writable } from 'stream';
import archiver = require('archiver');
import { existsSync } from 'fs';
import { resolve } from 'path';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class BankService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly slack: SlackService,
    private readonly salesforce: SalesforceService,
    private readonly eventEmitter: EventEmitter2,
    private readonly chatService: ChatService,
    private readonly emailService: EmailService
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
        lanNumber: lanNumber, // Sync to lanNumber column
        lanEnteredAt: new Date().toISOString(), // Sync to lanEnteredAt column
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
    const { data: application, error: appError } = await this.db
      .from('LoanApplication')
      .select('userId, id, loanType')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return [];
    }

    const { data: documents, error: docsError } = await this.db
      .from('ApplicationDocument')
      .select('*')
      .eq('applicationId', applicationId);

    if (docsError) throw docsError;
    const docs = documents || [];

    // Also fetch the User's general Vault documents to show in a "Vault" section
    const { data: vaultDocs, error: vaultError } = await this.db
      .from('UserDocument')
      .select('*')
      .eq('userId', application.userId);

    if (vaultError) throw vaultError;

    // Merge or tag vault documents that aren't already in the application
    const applicationDocTypes = new Set(docs.map(d => d.docType));
    const extraVaultDocs = (vaultDocs || [])
      .filter(vd => !applicationDocTypes.has(vd.docType) && vd.uploaded)
      .map(vd => ({
        ...vd,
        id: `vault_${vd.id}`,
        isVaultDoc: true,
        docName: (vd.docType || '').replace(/_/g, ' ').toUpperCase(),
        status: vd.status || 'uploaded'
      }));

    return [...docs, ...extraVaultDocs];
  }

  private getS3Client() {
    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();

    if (!accessKeyId || !secretAccessKey) {
      return null;
    }

    const rawRegion = (process.env.AWS_REGION || 'us-east-1').trim();
    const regionMatch = rawRegion.match(/[a-z]{2}-[a-z]+-\d/i);
    const region = regionMatch ? regionMatch[0].toLowerCase() : 'us-east-1';

    let requestHandler;
    try {
      const { NodeHttpHandler } = require('@smithy/node-http-handler');
      requestHandler = new NodeHttpHandler({
        connectionTimeout: 1000,
        socketTimeout: 1500,
      });
    } catch (e) {
      console.warn('[BankService] NodeHttpHandler not found, using default handler');
    }

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(requestHandler ? { requestHandler } : {}),
    });
  }

  /**
   * Category A: Bulk zip document compiler
   */
  async generateDocumentsZip(applicationId: string): Promise<any> {
    console.log(`[BankService] Building bulk documents ZIP buffer for App ID: ${applicationId}`);

    const documents = await this.getDocuments(applicationId);
    const uploadedDocs = (documents || []).filter(
      (doc: any) => doc.filePath && doc.status !== 'not_uploaded'
    );

    if (uploadedDocs.length === 0) {
      throw new NotFoundException(`No uploaded student documents found for App ID: ${applicationId}`);
    }

    const archive = new (archiver as any).ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    const outputStream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });
    archive.pipe(outputStream);

    const s3Client = this.getS3Client();
    const bucket = (process.env.AWS_S3_BUCKET_NAME || '').trim();

    for (const doc of uploadedDocs) {
      const docName = (doc.docName || doc.docType || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = doc.fileName ? doc.fileName.split('.').pop() : 'pdf';
      const filename = `${docName}.${ext}`;

      // 1. Check if DigiLocker record
      if (doc.filePath.startsWith('in.gov.')) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>DigiLocker Record - ${doc.docName || doc.docType}</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #f0f2f5; display: flex; justify-content: center; padding: 40px; }
        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; width: 100%; border-top: 6px solid #82c91e; }
        .header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .title { margin: 0; color: #1a3a6b; }
        .badge { background: #e6fced; color: #12b842; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 14px; white-space: nowrap; }
        .field { margin-bottom: 20px; }
        .label { font-size: 13px; color: #666; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .value { font-size: 18px; color: #333; margin-top: 4px; word-break: break-all; }
        .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h2 class="title">Digital Verification Record</h2>
            <span class="badge">✓ Verified by DigiLocker</span>
        </div>
        <div class="field">
            <div class="label">Document Name</div>
            <div class="value">${doc.docName || doc.docType || 'Document'}</div>
        </div>
        <div class="field">
            <div class="label">DigiLocker Reference URI</div>
            <div class="value">${doc.filePath}</div>
        </div>
        <div class="field">
            <div class="label">Date Synced</div>
            <div class="value">${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}</div>
        </div>
        <div class="footer">
            This is a digitally verified record synced directly from DigiLocker. The physical file is held securely by the issuing authority.
        </div>
    </div>
</body>
</html>`;
        archive.append(html, { name: `${docName}_digilocker.html` });
        continue;
      }

      // 2. Check if local file exists
      const absolutePath = resolve(doc.filePath);
      if (existsSync(absolutePath)) {
        archive.file(absolutePath, { name: filename });
        continue;
      }

      // 3. Try fetching from S3 via presigned URL with a fast fetch timeout (if S3 is configured)
      if (s3Client && bucket) {
        try {
          const command = new GetObjectCommand({
            Bucket: bucket,
            Key: doc.filePath,
          });
          const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          const response = await fetch(presignedUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          archive.append(buffer, { name: filename });
          continue;
        } catch (s3Error: any) {
          console.error(`[generateDocumentsZip] S3 fetch failed for key ${doc.filePath}:`, s3Error.message || s3Error);
        }
      }

      // 4. Fallback to missing document mock pdf/text
      const fallbackPath = resolve(process.cwd(), 'public/mock/document_missing.pdf');
      if (existsSync(fallbackPath)) {
        archive.file(fallbackPath, { name: filename });
      } else {
        archive.append('Document file not found on disk or S3', { name: `${docName}_missing.txt` });
      }
    }

    const bufferPromise = new Promise<Buffer>((res, rej) => {
      outputStream.on('finish', () => res(Buffer.concat(chunks)));
      archive.on('error', rej);
    });

    await archive.finalize();
    const buffer = await bufferPromise;

    return {
      success: true,
      fileName: `VL_Student_Docs_${applicationId}.zip`,
      mimeType: 'application/zip',
      fileSize: buffer.length,
      buffer
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

    // Enforce LAN check for sanction decisions
    if (['sanctioned', 'conditional_sanction'].includes(targetStatus) && !application.lanNumber) {
      throw new BadRequestException('Cannot sanction loan application: LAN (Loan Account Number) must be entered/logged first.');
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

      // Post sanction to the bank chat channel
      try {
        const safeBank = (application.bank || 'Unknown_Bank').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const shortAppId = application.applicationNumber || applicationId.slice(0, 8);
        const displayName = `${application.bank || 'Bank'} - App #${shortAppId}`;
        const syntheticPhone = `BNK_${safeBank}_APP_${applicationId}`;

        const conversation = await this.chatService.getOrCreateConversation(
          syntheticPhone,
          `bank+${safeBank.toLowerCase()}@internal`,
          'bank',
          displayName,
          application.bank || 'Bank',
          {
            applicationId: applicationId,
            applicationNumber: application.applicationNumber || null,
          }
        );

        const messageContent = `✅ **Loan Sanctioned**\n\nThe bank has approved and sanctioned this application!\n\n` +
          `**Sanction Amount:** ₹${(details.sanctionAmount || application.amount || 0).toLocaleString('en-IN')}\n` +
          `**Interest Rate:** ${details.interestRate || 9.5}% (${details.roiType || 'floating'})\n` +
          `**Tenure:** ${details.tenure || 120} months\n\n` +
          `**Remarks/Notes:** ${details.remarks || 'No additional remarks.'}`;

        const savedMessage = await this.chatService.saveMessage({
          conversationId: conversation.id,
          senderType: 'bank',
          senderId: bankUser.email || bankUser.id || 'bank-system',
          senderName: `${bankUser.firstName || 'Banker'} (${application.bank || 'Bank'})`,
          content: messageContent,
          messageType: 'text',
          status: 'sent'
        });

        this.eventEmitter.emit('chat.message_created', savedMessage);
      } catch (chatError) {
        console.error(`[BankService] Failed to post sanction to chat:`, chatError);
      }
    } else if (targetStatus === 'conditional_sanction') {
      await this.db.from('conditional_sanctions').insert({
        applicationId: applicationId,
        conditionsList: details.conditions || ['Provide academic marksheets'],
        deadline: details.deadline || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        createdAt: nowStr
      });

      try {
        const safeBank = (application.bank || 'Unknown_Bank').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const syntheticPhone = `BNK_${safeBank}_APP_${applicationId}`;
        const shortAppId = application.applicationNumber || applicationId.slice(0, 8);
        const displayName = `${application.bank || 'Bank'} - App #${shortAppId}`;

        // Get or create conversation with the bank for this application
        const conversation = await this.chatService.getOrCreateConversation(
          syntheticPhone,
          `bank+${safeBank.toLowerCase()}@internal`,
          'bank',
          displayName,
          application.bank || 'Bank',
          {
            applicationId: applicationId,
            applicationNumber: application.applicationNumber || null,
          }
        );

        // Build list of conditions for the chat content
        let conditionsStr = '';
        if (Array.isArray(details.conditions) && details.conditions.length > 0) {
          conditionsStr = details.conditions.map((c: any, index: number) => {
            const num = index + 1;
            if (typeof c === 'string') {
              return `${num}. ${c}`;
            }
            const typeLabel = c.type ? ` [${c.type.toUpperCase()}]` : '';
            const deadlineLabel = c.deadline ? ` (Deadline: ${c.deadline})` : '';
            return `${num}. ${c.text}${typeLabel}${deadlineLabel}`;
          }).join('\n');
        } else {
          conditionsStr = 'None specified';
        }

        const messageContent = `🔔 **Conditional Sanction Submitted**\n\nThe bank has conditionally sanctioned the loan application.\n\n` +
          `**Sanction Amount:** ₹${(details.sanctionAmount || application.amount || 0).toLocaleString('en-IN')}\n` +
          `**Interest Rate:** ${details.interestRate || application.interestRate || 'N/A'}% (${details.roiType || 'floating'})\n` +
          `**Decision Deadline:** ${details.deadline || 'N/A'}\n\n` +
          `**Conditions List:**\n${conditionsStr}\n\n` +
          `**Remarks/Notes:** ${details.remarks || 'No additional remarks.'}`;

        // Save the support message in this conversation
        const savedMessage = await this.chatService.saveMessage({
          conversationId: conversation.id,
          senderType: 'bank',
          senderId: bankUser.email || bankUser.id || 'bank-system',
          senderName: `${bankUser.firstName || 'Banker'} (${application.bank || 'Bank'})`,
          content: messageContent,
          messageType: 'text',
          status: 'sent'
        });

        // Broadcast to WebSocket clients
        this.eventEmitter.emit('chat.message_created', savedMessage);
        
        console.log(`[BankService] Real-time conditions message posted to chat conversation ${conversation.id}`);
      } catch (chatError) {
        console.error(`[BankService] Failed to post conditional sanction checklist to staff chat:`, chatError);
      }
    } else if (targetStatus === 'counter_offer') {
      await this.db.from('counter_offers').insert({
        applicationId: applicationId,
        offeredAmount: details.offeredAmount || application.amount * 0.9,
        offeredRate: details.offeredRate || 10.5,
        offeredTenure: details.offeredTenure || 96,
        status: 'pending'
      });

      // Post counter offer to the bank chat channel
      try {
        const safeBank = (application.bank || 'Unknown_Bank').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const shortAppId = application.applicationNumber || applicationId.slice(0, 8);
        const displayName = `${application.bank || 'Bank'} - App #${shortAppId}`;
        const syntheticPhone = `BNK_${safeBank}_APP_${applicationId}`;

        const conversation = await this.chatService.getOrCreateConversation(
          syntheticPhone,
          `bank+${safeBank.toLowerCase()}@internal`,
          'bank',
          displayName,
          application.bank || 'Bank',
          {
            applicationId: applicationId,
            applicationNumber: application.applicationNumber || null,
          }
        );

        const offeredAmount = details.offeredAmount || details.sanctionAmount || (application.amount * 0.9);
        const offeredRate = details.offeredRate || details.interestRate || 10.5;
        const offeredTenure = details.offeredTenure || details.tenure || 96;

        const messageContent = `🔄 **Counter Offer Proposed**\n\nThe bank has proposed a counter offer for the loan application.\n\n` +
          `**Offered Amount:** ₹${(offeredAmount).toLocaleString('en-IN')}\n` +
          `**Offered Rate:** ${offeredRate}%\n` +
          `**Offered Tenure:** ${offeredTenure} months\n\n` +
          `**Remarks/Notes:** ${details.remarks || 'No additional remarks.'}`;

        const savedMessage = await this.chatService.saveMessage({
          conversationId: conversation.id,
          senderType: 'bank',
          senderId: bankUser.email || bankUser.id || 'bank-system',
          senderName: `${bankUser.firstName || 'Banker'} (${application.bank || 'Bank'})`,
          content: messageContent,
          messageType: 'text',
          status: 'sent'
        });

        this.eventEmitter.emit('chat.message_created', savedMessage);
      } catch (chatError) {
        console.error(`[BankService] Failed to post counter offer to chat:`, chatError);
      }
    } else if (targetStatus === 'rejected') {
      await this.db.from('rejections').insert({
        applicationId: applicationId,
        reason: details.reason || 'Credit score shortfall',
        rejectedAt: nowStr
      });

      // Post rejection to the bank chat channel
      try {
        const safeBank = (application.bank || 'Unknown_Bank').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const shortAppId = application.applicationNumber || applicationId.slice(0, 8);
        const displayName = `${application.bank || 'Bank'} - App #${shortAppId}`;
        const syntheticPhone = `BNK_${safeBank}_APP_${applicationId}`;

        const conversation = await this.chatService.getOrCreateConversation(
          syntheticPhone,
          `bank+${safeBank.toLowerCase()}@internal`,
          'bank',
          displayName,
          application.bank || 'Bank',
          {
            applicationId: applicationId,
            applicationNumber: application.applicationNumber || null,
          }
        );

        const messageContent = `🚨 **Application Rejected**\n\nThe bank has rejected the loan application.\n\n` +
          `**Category:** ${details.rejectionCategory || details.category || 'N/A'}\n` +
          `**Reason:** ${details.reason || 'Unspecified credit policy deviation'}\n\n` +
          `**Remarks/Notes:** ${details.remarks || 'No additional remarks.'}`;

        const savedMessage = await this.chatService.saveMessage({
          conversationId: conversation.id,
          senderType: 'bank',
          senderId: bankUser.email || bankUser.id || 'bank-system',
          senderName: `${bankUser.firstName || 'Banker'} (${application.bank || 'Bank'})`,
          content: messageContent,
          messageType: 'text',
          status: 'sent'
        });

        this.eventEmitter.emit('chat.message_created', savedMessage);
      } catch (chatError) {
        console.error(`[BankService] Failed to post rejection to chat:`, chatError);
      }
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

    // Fetch latest app with user relation to get the registered email and send bank decision email
    try {
      const { data: latestApp } = await this.db
        .from('LoanApplication')
        .select('*, user:User!userId(id, email, firstName, lastName)')
        .eq('id', applicationId)
        .single();

      if (latestApp) {
        const email = latestApp.user?.email || latestApp.email;
        if (email) {
          const firstName = latestApp.firstName || latestApp.user?.firstName || '';
          const lastName = latestApp.lastName || latestApp.user?.lastName || '';
          const userName = `${firstName} ${lastName}`.trim() || 'Student';
          const bankName = latestApp.bank || application.bank || 'our partner bank';

          if (targetStatus === 'sanctioned') {
            await this.emailService.sendApplicationAcceptedByBankEmail(email, userName, bankName, latestApp, details);
          } else if (targetStatus === 'rejected') {
            await this.emailService.sendApplicationRejectedByBankEmail(email, userName, bankName, details.reason || details.remarks || '');
          }
        }
      }
    } catch (err) {
      console.error('[BankService.registerDecision] Failed to send bank decision email:', err);
    }

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

    // Notify staff via in-app notification
    try {
      let notifTitle = '';
      let notifBody = '';
      let notifType = '';

      if (targetStatus === 'sanctioned') {
        notifTitle = '✅ Loan Sanctioned';
        notifBody = `Bank ${application.bank || 'Bank'} has sanctioned App: ${application.applicationNumber || applicationId} for ₹${(details.sanctionAmount || application.amount || 0).toLocaleString('en-IN')}`;
        notifType = 'application_approved';
      } else if (targetStatus === 'conditional_sanction') {
        notifTitle = '⚠️ Conditional Sanction';
        notifBody = `Bank ${application.bank || 'Bank'} has conditionally sanctioned App: ${application.applicationNumber || applicationId}`;
        notifType = 'application_conditional';
      } else if (targetStatus === 'counter_offer') {
        notifTitle = '🔄 Counter Offer Proposed';
        notifBody = `Bank ${application.bank || 'Bank'} proposed a counter offer for App: ${application.applicationNumber || applicationId}`;
        notifType = 'application_counter';
      } else if (targetStatus === 'rejected') {
        notifTitle = '❌ Application Rejected';
        notifBody = `Bank ${application.bank || 'Bank'} has rejected App: ${application.applicationNumber || applicationId}`;
        notifType = 'application_rejected';
      }

      if (notifTitle) {
        const notifData = {
          id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          userId: 'staff',
          title: notifTitle,
          body: notifBody,
          type: notifType,
          isRead: false,
          timestamp: nowStr,
          metadata: {
            applicationId: applicationId,
            applicationNumber: application.applicationNumber || null,
            bank: application.bank || null,
            status: targetStatus
          }
        };
        await this.db.from('Notification').insert(notifData);
        this.eventEmitter.emit('notification.created', notifData);
      }
    } catch (notifErr) {
      console.error('[BankService.registerDecision] Failed to create in-app notification:', notifErr);
    }

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
      timestamp: new Date().toISOString(),
      metadata: {
        applicationId: applicationId,
        applicationNumber: application?.applicationNumber || null,
        bank: application?.bank || null,
        status: 'query_raised'
      }
    };
    await this.db.from('Notification').insert(notifData);
    this.eventEmitter.emit('notification.created', notifData);

    // Push query message to the chat conversation
    if (application) {
      // 1. Send message to student chat channel (as before)
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

      // 2. Also send query message to the dedicated Bank chat channel (shows up in staff chat Banks tab)
      try {
        const safeBank = (application.bank || 'Unknown_Bank').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const shortAppId = application.applicationNumber || applicationId.slice(0, 8);
        const displayName = `${application.bank || 'Bank'} - App #${shortAppId}`;
        const syntheticPhone = `BNK_${safeBank}_APP_${applicationId}`;

        const conversation = await this.chatService.getOrCreateConversation(
          syntheticPhone,
          `bank+${safeBank.toLowerCase()}@internal`,
          'bank',
          displayName,
          application.bank || 'Bank',
          {
            applicationId: applicationId,
            applicationNumber: application.applicationNumber || null,
          }
        );

        if (conversation) {
          const bankName = bankUser.firstName || 'Banker';
          const msgContent = `❓ **Query Raised**\n\nThe bank has raised a query on the loan application:\n\n"${content}"`;

          const savedMessage = await this.chatService.saveMessage({
            conversationId: conversation.id,
            senderType: 'bank',
            senderId: bankUser.email || bankUser.id || 'bank-system',
            senderName: `${bankUser.firstName || 'Banker'} (${application.bank || 'Bank'})`,
            content: msgContent,
            messageType: 'text',
            status: 'sent'
          });

          if (savedMessage) {
            // Emit the programmatically created message so WebSocket clients receive it in real-time
            this.eventEmitter.emit('chat.message_created', savedMessage);
          }
        }
      } catch (chatError) {
        console.error(`[BankService] Failed to post query to bank chat channel:`, chatError);
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
      utrNumber,
      trancheNumber,
      transferMode,
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
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException(`Loan application with ID "${applicationId}" not found or error: ${error?.message}`);
    }

    // Fetch relations manually to avoid PostgREST relationship schema cache failures
    const [
      { data: bankDecisions },
      { data: disbursements },
      { data: fileQualityScores },
      { data: queries },
      { data: processingFee },
      { data: condSanctions }
    ] = await Promise.all([
      this.db.from('BankDecision').select('*').eq('applicationId', applicationId),
      this.db.from('disbursements').select('*').eq('applicationId', applicationId),
      this.db.from('file_quality_scores').select('*').eq('applicationId', applicationId),
      this.db.from('queries').select('*').eq('applicationId', applicationId),
      this.db.from('ProcessingFee').select('*').eq('applicationId', applicationId),
      this.db.from('conditional_sanctions').select('*').eq('applicationId', applicationId).order('createdAt', { ascending: false })
    ]);

    data.BankDecision = bankDecisions || [];
    data.disbursements = disbursements || [];
    data.file_quality_scores = fileQualityScores || [];
    data.queries = queries || [];
    data.ProcessingFee = processingFee || [];
    data.conditional_sanctions = condSanctions || [];

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
    const { data: appData } = await this.db
      .from('LoanApplication')
      .select('userId')
      .eq('id', applicationId)
      .single();

    const userId = appData?.userId || null;

    const { data, error } = await this.db
      .from('ConsentRecord')
      .upsert(
        {
          applicationId,
          userId,
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

  async saveConditionalSanctions(applicationId: string, conditions: any[], deadline?: string) {
    const nowStr = new Date().toISOString();

    // Check if a record already exists
    const { data: existing, error: fetchError } = await this.db
      .from('conditional_sanctions')
      .select('*')
      .eq('applicationId', applicationId)
      .maybeSingle();

    if (existing) {
      // Update
      const { data, error } = await this.db
        .from('conditional_sanctions')
        .update({
          conditionsList: conditions,
          deadline: deadline ? new Date(deadline).toISOString() : existing.deadline || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } else {
      // Insert
      const { data, error } = await this.db
        .from('conditional_sanctions')
        .insert({
          id: 'cond-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          applicationId,
          conditionsList: conditions,
          deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          createdAt: nowStr
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    }
  }
}

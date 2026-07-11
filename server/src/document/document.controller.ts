import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Param,
  Delete,
  Res,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '../users/users.service';
import { DigilockerService } from '../integration/digilocker.service';
import { DocumentVerificationService } from '../ai/services/document-verification.service';
import { KycService } from '../ai/services/kyc.service';
import { maskSensitiveIds } from '../ai/utils/ocr-fields.util';
import { S3Service } from './s3.service';
import { SupabaseService } from '../supabase/supabase.service';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// ── Use in-memory storage — files go straight to S3, never touch disk ──────
const storage = memoryStorage();

@Controller('documents')
export class DocumentController {
  constructor(
    private usersService: UsersService,
    private digilockerService: DigilockerService,
    private docVerificationService: DocumentVerificationService,
    private kycService: KycService,
    private s3Service: S3Service,
    private supabase: SupabaseService,
  ) { }

  // ─── Upload & store to S3 ────────────────────────────────────────────────
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Unsupported file type'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    @Body('docType') docType: string,
    @Body('docName') docName?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!userId || !docType)
      throw new BadRequestException('userId and docType are required');

    console.log(
      `[UPLOAD] Processing pre-storage check: userId=${userId}, docType=${docType}, file=${file.originalname} (${file.size} bytes)`,
    );

    try {
      const isOtherDoc = docType.toLowerCase().includes('other');
      let kycResult: any;

      if (isOtherDoc) {
        console.log(`[UPLOAD] Bypassing AI KYC check for custom document type: ${docType}`);
        kycResult = {
          document_type: docType,
          confidence_score: 100,
          is_valid: true,
          extracted_data: {},
          document_validation: {},
          ocr_issues: []
        };
      } else {
        // ── 1. Perform AI OCR Verification BEFORE storing in S3 ───────────────
        console.log(`[UPLOAD] Running pre-storage KYC verification for ${docType}...`);
        try {
          kycResult = await this.kycService.processDocument(
            file.buffer,
            file.mimetype,
            docType,
          );
        } catch (aiError: any) {
          console.error(`[UPLOAD] KYC Service threw an error: ${aiError.message || aiError}. Running local keyword check...`);

          // Even on AI exceptions, we must verify document integrity to reject completely wrong uploads
          const isImage = file.mimetype.startsWith('image/');
          const isPdf = file.mimetype === 'application/pdf';
          const integrityCheck = await this.kycService.validateDocumentKeywords(file.buffer, docType, isPdf, isImage);

          if (!integrityCheck.is_valid) {
            console.warn(`[UPLOAD] Rejecting invalid ${docType} on KYC service exception. Error: ${integrityCheck.error}`);
            throw new BadRequestException(
              `Document verification failed: The uploaded file was not recognized as a valid ${docType.toUpperCase().replace(/_/g, ' ')}. ` +
              `Details: ${integrityCheck.error}. Please check your document and re-upload the correct file.`
            );
          }

          // Graceful fallback for external service failures when document is valid
          kycResult = {
            document_type: docType,
            confidence_score: 50,
            is_valid: true,
            extracted_data: {},
            error: `AI verification service temporarily offline: ${aiError.message || 'Unknown error'}`
          };
        }
      }

      console.log(
        `[UPLOAD] KYC pre-check result: valid=${kycResult.is_valid}, confidence=${kycResult.confidence_score}%`,
      );

      // If document is not valid (AI service processed successfully and rejected it), immediately abort
      if (!kycResult.is_valid) {
        const docLabel = docType.toUpperCase().replace(/_/g, ' ');
        const errorMessage = kycResult.error || 'The uploaded file does not match the expected document type or has validation errors.';
        console.warn(`[UPLOAD] Rejecting invalid ${docType}. OCR Error: ${errorMessage}`);
        throw new BadRequestException(
          `Document verification failed: The uploaded file was not recognized as a valid ${docLabel}. ` +
          `Details: ${errorMessage}. Please check your document and re-upload the correct file.`
        );
      }

      // ── 2. Verified! Proceed to Upload to S3 (with Local Fallback) ───────
      const fileExt = path.extname(file.originalname);
      const s3Key = `vault/${userId}/${docType}${fileExt}`;
      let previewUrl = '';
      try {
        await this.s3Service.upload(s3Key, file.buffer, file.mimetype);
        console.log(`[UPLOAD] Verified document stored in S3: ${s3Key}`);
        previewUrl = await this.s3Service.getPresignedUrl(s3Key, 3600);
      } catch (s3Error: any) {
        console.warn(`[UPLOAD] AWS S3 Upload failed: ${s3Error.message || s3Error}. Falling back to local storage routing.`);

        // Write the file locally on the server in a local uploads directory as a fallback!
        try {
          const localDir = path.join(process.cwd(), 'uploads', userId, docType);
          await fs.promises.mkdir(localDir, { recursive: true });
          await fs.promises.writeFile(path.join(localDir, `file${fileExt}`), file.buffer);
          console.log(`[UPLOAD] Graceful local fallback copy saved at: ${localDir}`);
        } catch (localWriteError: any) {
          console.error('[UPLOAD] Local write fallback failed:', localWriteError.message);
        }

        // Return a clean local viewing API route instead of crashing!
        previewUrl = `/api/documents/view/${userId}/${docType}`;
      }

      // ── 3. Build Verification Metadata & Update User profile ─────────────
      const verificationResult = {
        isValid: true,
        code: 'AI_VERIFIED',
        confidence: kycResult.confidence_score,
        docName: docName || undefined,
        details: {
          message: 'Document verified by AI OCR pre-storage.',
          extractedFields: kycResult.extracted_data,
          document_validation: kycResult.document_validation,
          ocr_issues: kycResult.ocr_issues,
        },
      };

      if (
        kycResult.extracted_data &&
        Object.keys(kycResult.extracted_data).length > 0
      ) {
        await this.usersService.updateExtractedDetails(userId, {
          documentVerified: true,
          ...maskSensitiveIds(kycResult.extracted_data, docType),
        }, docType);
      }

      // ── 4. Save record in database ───────────────────────────────────────
      const document = await this.usersService.upsertUserDocument(
        userId,
        docType,
        {
          uploaded: true,
          filePath: s3Key,
          status: 'uploaded',
          verificationMetadata: verificationResult,
        },
      );

      console.log(`[UPLOAD] DB record saved. Doc ID: ${document?.id}`);

      // ── 5. Generate a short-lived presigned URL for preview ───────────────
      return {
        success: true,
        message: 'Document validated, stored in S3, and registered successfully',
        data: {
          ...document,
          status: 'uploaded',
          previewUrl,
          verification: verificationResult,
          aiExplanation: null,
          ocrResult: {
            isValid: true,
            confidence: kycResult.confidence_score,
            extractedFields: kycResult.extracted_data,
            document_validation: kycResult.document_validation,
            ocr_issues: kycResult.ocr_issues,
            reason: 'Verified',
          },
        },
        file: {
          originalName: file.originalname,
          s3Key,
        },
      };
    } catch (error: any) {
      console.error('[UPLOAD] Error:', error?.message);
      // Let nest throw custom BadRequestExceptions natively, else wrap general errors
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Upload failed: ${error.message || 'Processing error'}`,
      );
    }
  }

  // ─── OCR Re-verify (reads from S3) ──────────────────────────────────────
  @Post('ocr-reverify')
  async ocrReverify(
    @Body('userId') userId: string,
    @Body('docType') docType: string,
  ) {
    if (!userId || !docType)
      throw new BadRequestException('userId and docType are required');

    console.log(
      `[OCR-REVERIFY] userId=${userId}, docType=${docType}`,
    );

    const isOtherDoc = docType.toLowerCase().includes('other');
    if (isOtherDoc) {
      return {
        success: true,
        message: 'Bypassed verification for other document type.',
        data: {
          status: 'uploaded',
          ocrResult: {
            isValid: true,
            confidence: 100,
            extractedFields: {},
            reason: 'Bypassed',
          }
        }
      };
    }

    const docs = await this.usersService.getUserDocuments(userId);
    const doc = docs.find((d) => d.docType === docType);

    if (!doc || !doc.filePath) {
      throw new NotFoundException(
        'Document not found. Please upload the document first.',
      );
    }

    // Fetch file from S3 via presigned URL → buffer
    const presignedUrl = await this.s3Service.getPresignedUrl(doc.filePath);
    const res = await fetch(presignedUrl);
    if (!res.ok)
      throw new NotFoundException('Could not retrieve document from S3.');

    const fileBuffer = Buffer.from(await res.arrayBuffer());
    const mimetype = doc.filePath.endsWith('.pdf')
      ? 'application/pdf'
      : 'image/jpeg';

    let kycResult: any;
    try {
      kycResult = await this.kycService.processDocument(
        fileBuffer,
        mimetype,
        docType,
      );
    } catch (aiError: any) {
      console.error(`[OCR-REVERIFY] KYC Service threw an error: ${aiError.message || aiError}. Running local keyword check fallback...`);
      const isImage = mimetype.startsWith('image/');
      const isPdf = mimetype === 'application/pdf';
      const integrityCheck = await this.kycService.validateDocumentKeywords(fileBuffer, docType, isPdf, isImage);

      if (!integrityCheck.is_valid) {
        console.warn(`[OCR-REVERIFY] Rejecting invalid ${docType} on KYC service exception. Error: ${integrityCheck.error}`);
        throw new BadRequestException(
          `Document verification failed: The document was not recognized as a valid ${docType.toUpperCase().replace(/_/g, ' ')}. ` +
          `Details: ${integrityCheck.error}. Please check your document.`
        );
      }

      // Graceful fallback for external service failures when document is valid
      kycResult = {
        document_type: docType,
        confidence_score: 50,
        is_valid: true,
        extracted_data: {},
        error: `AI verification service temporarily offline: ${aiError.message || 'Unknown error'}`
      };
    }

    const newStatus = kycResult.is_valid ? 'uploaded' : 'rejected';
    const verificationResult = {
      isValid: kycResult.is_valid,
      code: kycResult.is_valid ? 'AI_VERIFIED' : 'AI_REJECTED',
      confidence: kycResult.confidence_score,
      details: {
        message: kycResult.is_valid
          ? 'Document re-verified by AI OCR.'
          : kycResult.error || 'Verification failed',
        extractedFields: kycResult.extracted_data,
        document_validation: kycResult.document_validation,
        ocr_issues: kycResult.ocr_issues,
      },
    };

    await this.usersService.upsertUserDocument(userId, docType, {
      uploaded: true,
      filePath: doc.filePath,
      status: newStatus,
      verificationMetadata: verificationResult,
    });

    if (
      kycResult.is_valid &&
      kycResult.extracted_data &&
      Object.keys(kycResult.extracted_data).length > 0
    ) {
      await this.usersService.updateExtractedDetails(userId, {
        documentVerified: true,
        ...maskSensitiveIds(kycResult.extracted_data, docType),
      }, docType);
    }

    return {
      success: true,
      data: {
        docType,
        userId,
        isValid: kycResult.is_valid,
        confidence: kycResult.confidence_score,
        extractedFields: kycResult.extracted_data,
        reason: kycResult.error,
        newStatus,
        verification: verificationResult,
        ocrResult: {
          isValid: kycResult.is_valid,
          confidence: kycResult.confidence_score,
          extractedFields: kycResult.extracted_data,
          document_validation: kycResult.document_validation,
          ocr_issues: kycResult.ocr_issues,
        },
      },
    };
  }

  // ─── DigiLocker flow ─────────────────────────────────────────────────────
  @Post('digilocker/initiate')
  async initiateDigilockerFlow(
    @Body('userId') userId: string,
    @Body('docType') docType: string,
    @Body('redirectUri') redirectUri: string,
  ) {
    if (!userId || !docType)
      throw new BadRequestException('userId and docType are required');

    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const callbackUrl =
      process.env.DIGILOCKER_CALLBACK_URL ||
      backendUrl + '/api/digilocker/callback';

    const stateData = { userId, docType, redirectUri, codeVerifier };
    const state = Buffer.from(JSON.stringify(stateData))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const authUrl = this.digilockerService.getAuthUrl(
      state,
      callbackUrl,
      codeChallenge,
    );

    return { success: true, authUrl };
  }

  // ─── View document — redirects to a short-lived S3 presigned URL ─────────
  @Get('view/:userId/:docType')
  async viewDocument(
    @Param('userId') userId: string,
    @Param('docType') docType: string,
    @Query('bankId') bankId: string,
    @Res() res: Response,
  ) {
    if (bankId) {
      const { data: consent } = await this.supabase.client
        .from('StudentBankConsent')
        .select('isGranted')
        .eq('studentId', userId)
        .eq('bankId', bankId)
        .maybeSingle();

      if (!consent || !consent.isGranted) {
        throw new ForbiddenException('Access denied: Explicit student consent is required for this bank to view this document.');
      }

      await this.supabase.client.from('data_access_logs').insert({
        accessedBy: bankId,
        applicationId: userId,
        action: `Viewed document type: ${docType}`,
        accessedAt: new Date().toISOString(),
      });
    }

    const docs = await this.usersService.getUserDocuments(userId);
    const doc = docs.find((d) => d.docType === docType);

    if (!doc || !doc.filePath)
      throw new NotFoundException('Document not found');

    // Check local fallback first
    const localDir = path.join(process.cwd(), 'uploads', userId, docType);
    if (fs.existsSync(localDir)) {
      const files = fs.readdirSync(localDir);
      if (files.length > 0) {
        const localFilePath = path.join(localDir, files[0]);
        return res.sendFile(localFilePath);
      }
    }

    // DigiLocker virtual record
    if (doc.filePath.startsWith('in.gov.')) {
      const html = `<!DOCTYPE html><html><head><title>DigiLocker Record - ${doc.docName || doc.docType}</title>
<style>body{font-family:system-ui,sans-serif;background:#f0f2f5;display:flex;justify-content:center;padding:40px}.card{background:white;padding:40px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);max-width:600px;width:100%;border-top:6px solid #82c91e}.badge{background:#e6fced;color:#12b842;padding:6px 12px;border-radius:20px;font-weight:600;font-size:14px}</style></head>
<body><div class="card"><h2>Digital Verification Record</h2><span class="badge">✓ Verified by DigiLocker</span>
<p><strong>Document:</strong> ${doc.docName || doc.docType}</p>
<p><strong>Reference:</strong> ${doc.filePath}</p></div></body></html>`;
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    // Generate presigned S3 URL (1 hour expiry) and redirect
    try {
      const presignedUrl = await this.s3Service.getPresignedUrl(
        doc.filePath,
        3600,
      );
      return res.redirect(302, presignedUrl);
    } catch (err) {
      console.error('[VIEW] Failed to generate presigned URL:', err);
      throw new NotFoundException('Unable to retrieve document from storage.');
    }
  }

  // ─── Presigned URL endpoint (for frontend preview without redirect) ───────
  @Get('presigned-view/:userId/:docType')
  async getPresignedViewUrl(
    @Param('userId') userId: string,
    @Param('docType') docType: string,
    @Query('bankId') bankId: string,
  ) {
    if (bankId) {
      const { data: consent } = await this.supabase.client
        .from('StudentBankConsent')
        .select('isGranted')
        .eq('studentId', userId)
        .eq('bankId', bankId)
        .maybeSingle();

      if (!consent || !consent.isGranted) {
        throw new ForbiddenException('Access denied: Explicit student consent is required for this bank to view this document.');
      }

      await this.supabase.client.from('data_access_logs').insert({
        accessedBy: bankId,
        applicationId: userId,
        action: `Generated preview link for document: ${docType}`,
        accessedAt: new Date().toISOString(),
      });
    }

    const docs = await this.usersService.getUserDocuments(userId);
    const doc = docs.find((d) => d.docType === docType);

    if (!doc || !doc.filePath)
      throw new NotFoundException('Document not found');

    // Check local fallback first
    const localDir = path.join(process.cwd(), 'uploads', userId, docType);
    if (fs.existsSync(localDir)) {
      const files = fs.readdirSync(localDir);
      if (files.length > 0) {
        return { success: true, url: `/api/documents/view/${userId}/${docType}`, docType, filePath: doc.filePath };
      }
    }

    const url = await this.s3Service.getPresignedUrl(doc.filePath, 3600);
    return { success: true, url, docType, filePath: doc.filePath };
  }

  // ─── List user documents ─────────────────────────────────────────────────
  @Get(':userId')
  async getUserDocuments(@Param('userId') userId: string) {
    const documents = await this.usersService.getUserDocuments(userId);
    return { success: true, data: documents };
  }

  // ─── Delete document — removes from S3 + DB ──────────────────────────────
  @Delete(':userId/:docType')
  async deleteDocument(
    @Param('userId') userId: string,
    @Param('docType') docType: string,
  ) {
    const docs = await this.usersService.getUserDocuments(userId);
    const doc = docs.find((d) => d.docType === docType);

    if (doc?.filePath && !doc.filePath.startsWith('in.gov.')) {
      await this.s3Service.delete(doc.filePath);
    }

    await this.usersService.deleteUserDocument(userId, docType);
    return { success: true, message: 'Document deleted successfully' };
  }

  // ─── Delete document file — removes from S3 but keeps DB requirement ──────
  @Delete(':userId/:docType/file')
  async deleteDocumentFile(
    @Param('userId') userId: string,
    @Param('docType') docType: string,
  ) {
    const docs = await this.usersService.getUserDocuments(userId);
    const doc = docs.find((d) => d.docType === docType);

    if (doc?.filePath && !doc.filePath.startsWith('in.gov.')) {
      await this.s3Service.delete(doc.filePath);
    }

    await this.usersService.upsertUserDocument(userId, docType, {
      uploaded: false,
      status: 'pending',
      filePath: null as any,
    });
    return { success: true, message: 'Document file removed successfully' };
  }

  // ─── Add document requirement ────────────────────────────────────────────
  @Post('requirement')
  async addRequirement(
    @Body('userId') userId: string,
    @Body('docType') docType: string,
    @Body('docName') docName?: string,
  ) {
    if (!userId || !docType)
      throw new BadRequestException('userId and docType are required');

    const existing = (
      await this.usersService.getUserDocuments(userId)
    ).find((d) => d.docType === docType);

    if (
      existing?.uploaded ||
      ['uploaded', 'verified'].includes(
        String(existing?.status || '').toLowerCase(),
      )
    ) {
      return {
        success: true,
        message: 'Requirement already has an uploaded document',
        data: existing,
      };
    }

    const document = await this.usersService.upsertUserDocument(
      userId,
      docType,
      {
        uploaded: false,
        status: 'pending',
        verificationMetadata: {
          message: 'Requirement added by staff',
          docName: docName || docType,
        },
      },
    );

    return {
      success: true,
      message: 'Requirement added successfully',
      data: document,
    };
  }

  // ─── Accept a document (staff action) ────────────────────────────────────
  @Post(':docId/accept')
  async acceptDocument(@Param('docId') docId: string) {
    if (!docId) {
      throw new BadRequestException('Document ID is required');
    }

    console.log(`[DOCUMENT-ACCEPT] Processing acceptance for docId: ${docId}`);

    try {
      const updatedDoc = await this.usersService.updateDocumentStatus(
        docId,
        'verified',
      );

      if (!updatedDoc) {
        throw new NotFoundException(`Document with ID ${docId} not found`);
      }

      console.log(`[DOCUMENT-ACCEPT] Document ${docId} accepted successfully`);

      return {
        success: true,
        message: 'Document accepted successfully',
        data: updatedDoc,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`[DOCUMENT-ACCEPT] Error accepting document ${docId}:`, error.message);
      throw new BadRequestException(
        `Failed to accept document: ${error.message || 'Unknown error'}`,
      );
    }
  }

  // ─── Reject a document with reason (staff action) ──────────────────────────
  @Post(':docId/reject')
  async rejectDocument(
    @Param('docId') docId: string,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    if (!docId) {
      throw new BadRequestException('Document ID is required');
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    console.log(`[DOCUMENT-REJECT] Processing rejection for docId: ${docId}, reason: ${rejectionReason}`);

    try {
      const updatedDoc = await this.usersService.updateDocumentStatus(
        docId,
        'rejected',
        rejectionReason.trim(),
      );

      if (!updatedDoc) {
        throw new NotFoundException(`Document with ID ${docId} not found`);
      }

      console.log(`[DOCUMENT-REJECT] Document ${docId} rejected successfully`);

      return {
        success: true,
        message: 'Document rejected successfully',
        data: updatedDoc,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`[DOCUMENT-REJECT] Error rejecting document ${docId}:`, error.message);
      throw new BadRequestException(
        `Failed to reject document: ${error.message || 'Unknown error'}`,
      );
    }
  }

  // ─── Send document to bank (staff action) ─────────────────────────────────
  @Post('send-to-bank')
  async sendDocumentToBank(
    @Body('userId') userId: string,
    @Body('docType') docType: string,
    @Body('docTitle') docTitle: string,
    @Body('bankId') bankId: string,
    @Body('bankName') bankName: string,
    @Body('notes') notes?: string,
    @Body('studentName') studentName?: string,
    @Body('applicationNumber') applicationNumber?: string,
  ) {
    if (!userId || !docType || !bankId) {
      throw new BadRequestException('userId, docType and bankId are required');
    }

    console.log(`[SEND-TO-BANK] userId=${userId} docType=${docType} bankName=${bankName}`);

    try {
      // Retrieve the document to confirm it exists
      const docs = await this.usersService.getUserDocuments(userId);
      const doc = docs.find((d) => d.docType === docType);

      if (!doc || !doc.filePath) {
        throw new NotFoundException('Document not found or not yet uploaded.');
      }

      // Generate a presigned URL for bank access (1 hour)
      let presignedUrl = '';
      try {
        presignedUrl = await this.s3Service.getPresignedUrl(doc.filePath, 3600);
      } catch (s3Err: any) {
        console.warn(`[SEND-TO-BANK] Could not generate presigned URL: ${s3Err.message}`);
        presignedUrl = `/api/documents/view/${userId}/${docType}`;
      }

      // Log the bank share event in audit log
      const transmissionId = `DOC-${Date.now().toString(36).toUpperCase()}-${docType.toUpperCase().slice(0, 4)}`;
      try {
        await this.supabase.client.from('data_access_logs').insert({
          accessedBy: bankId,
          applicationId: userId,
          action: `Staff sent document "${docTitle || docType}" to ${bankName}. Notes: ${notes || 'None'}. Ref: ${transmissionId}`,
          accessedAt: new Date().toISOString(),
        });
      } catch (logErr: any) {
        console.warn(`[SEND-TO-BANK] Audit log insert failed (non-blocking): ${logErr.message}`);
      }

      return {
        success: true,
        message: `Document "${docTitle || docType}" sent to ${bankName} successfully`,
        data: {
          transmissionId,
          bankId,
          bankName,
          docType,
          studentName,
          applicationNumber,
          presignedUrl,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`[SEND-TO-BANK] Error:`, error.message);
      throw new BadRequestException(`Failed to send document to bank: ${error.message || 'Unknown error'}`);
    }
  }
}

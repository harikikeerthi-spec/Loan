
import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, Param, Delete, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '../users/users.service';
import { DigilockerService } from '../integration/digilocker.service';
import { DocumentVerificationService } from '../ai/services/document-verification.service';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import type { Response } from 'express';
import * as crypto from 'crypto';

// Multer configuration
const storage = diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = resolve(process.cwd(), 'uploads', 'documents');
        try {
            if (!existsSync(uploadPath)) {
                mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        } catch (err: any) {
            console.error('[UPLOAD] Failed to create upload directory:', err);
            cb(new Error(`Failed to create upload directory: ${err.message}`), '');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

@Controller('documents')
export class DocumentController {
    constructor(
        private usersService: UsersService,
        private digilockerService: DigilockerService,
        private docVerificationService: DocumentVerificationService
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Unsupported file type'), false);
            }
        }
    }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('userId') userId: string,
        @Body('docType') docType: string
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (!userId || !docType) {
            unlinkSync(file.path);
            throw new BadRequestException('userId and docType are required');
        }

        try {
            let status = 'pending';
            let verificationResult: any = {
                isValid: false,
                code: 'MANUAL_UPLOAD',
                details: { message: 'Document uploaded manually. Awaiting automated or manual verification.' }
            };
            let aiExplanation: string | null = null;
            let ocrResult: any = null;

            console.log(`[UPLOAD] Processing file upload - userId: ${userId}, docType: ${docType}, fileName: ${file.originalname}, fileSize: ${file.size}, Mimetype: ${file.mimetype}`);

            // Fetch student profile for cross-checking
            let studentProfile: any = null;
            try {
                studentProfile = await this.usersService.findById(userId);
                console.log(`[UPLOAD] Student profile loaded: ${studentProfile?.firstName} ${studentProfile?.lastName}`);
            } catch (e) {
                console.warn('[UPLOAD] Could not fetch student profile for OCR cross-check:', e);
            }

            // AI Verification & Extraction via OCR
            try {
                console.log(`[UPLOAD] Reading file from disk: ${file.path}`);
                const fileBuffer = readFileSync(file.path);
                console.log(`[UPLOAD] File read successfully. Size: ${fileBuffer.length} bytes`);
                
                console.log(`[UPLOAD] Initiating OCR verification service for ${docType}...`);
                const aiResult = await this.docVerificationService.verifyAndExtractDocument(
                    docType,
                    fileBuffer,
                    file.mimetype,
                    studentProfile ? {
                        firstName: studentProfile.firstName,
                        lastName: studentProfile.lastName,
                        dateOfBirth: studentProfile.dateOfBirth,
                        email: studentProfile.email,
                    } : undefined
                );

                console.log(`[UPLOAD] OCR verification completed. Result: valid=${aiResult.isValid}, confidence=${aiResult.confidence}%`);
                ocrResult = aiResult;

                if (aiResult.isValid) {
                    status = 'uploaded';
                    verificationResult = {
                        isValid: true,
                        code: 'AI_VERIFIED',
                        confidence: aiResult.confidence,
                        details: {
                            message: 'Document verified by AI OCR successfully.',
                            extractedFields: aiResult.extractedFields,
                            matchResults: aiResult.matchResults,
                        }
                    };

                    if (aiResult.extractedFields && Object.keys(aiResult.extractedFields).length > 0) {
                        console.log(`[UPLOAD] Updating user details with extracted OCR data. Fields: ${Object.keys(aiResult.extractedFields).join(', ')}`);
                        await this.usersService.updateExtractedDetails(userId, {
                            documentVerified: true,
                            ...aiResult.extractedFields,
                        });
                        console.log(`[UPLOAD] Updated user details with extracted OCR data for ${userId}`);
                    }
                } else {
                    status = 'rejected';
                    verificationResult = {
                        isValid: false,
                        code: 'AI_REJECTED',
                        confidence: aiResult.confidence,
                        details: {
                            message: aiResult.reason || 'Document does not match expected type.',
                            extractedFields: aiResult.extractedFields,
                            matchResults: aiResult.matchResults,
                        }
                    };
                    aiExplanation = aiResult.reason || 'Invalid document type uploaded.';
                    console.log(`[UPLOAD] Document rejected by AI: ${aiExplanation}`);
                }
            } catch (aiError: any) {
                console.error(`[UPLOAD] AI Verification error:`, aiError?.message || aiError);
                console.error(`[UPLOAD] Full error stack:`, aiError?.stack);
                // Don't block upload if AI fails; default to pending
                status = 'pending';
                console.log(`[UPLOAD] Setting status to 'pending' due to AI verification error`);
            }

            console.log(`[UPLOAD] Finalizing document record in database - userId: ${userId}, docType: ${docType}`);
            try {
                const document = await this.usersService.upsertUserDocument(userId, docType, {
                    uploaded: true,
                    filePath: file.path,
                    status: status,
                    verificationMetadata: verificationResult
                });

                console.log(`[UPLOAD] Document record finalized successfully. Document ID: ${document?.id}`);

                return {
                    success: true,
                    message: 'Document uploaded and processed successfully',
                    data: {
                        ...document,
                        status: status,
                        verification: verificationResult,
                        aiExplanation: aiExplanation,
                        ocrResult: ocrResult ? {
                            isValid: ocrResult.isValid,
                            confidence: ocrResult.confidence,
                            extractedFields: ocrResult.extractedFields,
                            matchResults: ocrResult.matchResults,
                            reason: ocrResult.reason,
                        } : null,
                    },
                    file: {
                        originalName: file.originalname,
                        filename: file.filename
                    }
                };
            } catch (dbError: any) {
                console.error(`[UPLOAD] Database upsert failed:`, dbError?.message || dbError);
                throw new Error(`Failed to save document record: ${dbError.message || 'Unknown database error'}`);
            }
        } catch (error: any) {
            console.error(`[UPLOAD] Global upload error:`, error?.message || error);
            // Ensure we clean up the file if anything fails
            if (file && file.path && existsSync(file.path)) {
                try { 
                    unlinkSync(file.path); 
                    console.log(`[UPLOAD] Cleaned up file after error: ${file.path}`);
                } catch (cleanupError) {
                    console.error(`[UPLOAD] Failed to cleanup file: ${file.path}`, cleanupError);
                }
            }
            throw new BadRequestException(`Upload failed: ${error.message || 'Processing error'}`);
        }
    }

    /**
     * POST /documents/ocr-reverify
     * Staff-triggered OCR re-verification of an existing document.
     * Body: { userId, docType }
     */
    @Post('ocr-reverify')
    async ocrReverify(
        @Body('userId') userId: string,
        @Body('docType') docType: string,
    ) {
        if (!userId || !docType) {
            throw new BadRequestException('userId and docType are required');
        }

        console.log(`[OCR-REVERIFY] Starting OCR re-verification. userId=${userId}, docType=${docType}`);

        // Fetch the document record
        const docs = await this.usersService.getUserDocuments(userId);
        const doc = docs.find(d => d.docType === docType);

        if (!doc || !doc.filePath) {
            console.warn(`[OCR-REVERIFY] Document not found or no file path. userId=${userId}, docType=${docType}`);
            throw new NotFoundException('Document file not found. Please upload the document first.');
        }

        const absolutePath = resolve(doc.filePath);
        console.log(`[OCR-REVERIFY] Document path resolved: ${absolutePath}`);
        
        if (!existsSync(absolutePath)) {
            console.error(`[OCR-REVERIFY] File does not exist at path: ${absolutePath}`);
            throw new NotFoundException('Document file not found on disk.');
        }

        console.log(`[OCR-REVERIFY] File exists. Reading file...`);

        // Fetch student profile for cross-checking
        const studentProfile = await this.usersService.findById(userId);
        console.log(`[OCR-REVERIFY] Student profile loaded: ${studentProfile?.firstName} ${studentProfile?.lastName}`);

        // Read file and run OCR
        const fileBuffer = readFileSync(absolutePath);
        console.log(`[OCR-REVERIFY] File read successfully. Size: ${fileBuffer.length} bytes`);
        
        const mimetype = absolutePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        console.log(`[OCR-REVERIFY] File mimetype: ${mimetype}`);

        console.log(`[OCR-REVERIFY] Calling document verification service...`);

        const ocrResult = await this.docVerificationService.verifyAndExtractDocument(
            docType,
            fileBuffer,
            mimetype,
            studentProfile ? {
                firstName: studentProfile.firstName,
                lastName: studentProfile.lastName,
                dateOfBirth: studentProfile.dateOfBirth,
                email: studentProfile.email,
            } : undefined
        );

        console.log(`[OCR-REVERIFY] OCR verification completed. Result: valid=${ocrResult.isValid}, confidence=${ocrResult.confidence}%`);

        // Update document status based on result
        const newStatus = ocrResult.isValid ? 'uploaded' : 'rejected';
        console.log(`[OCR-REVERIFY] Updating document status to: ${newStatus}`);
        
        await this.usersService.upsertUserDocument(userId, docType, {
            uploaded: true,
            filePath: doc.filePath,
            status: newStatus,
        });

        console.log(`[OCR-REVERIFY] Document status updated successfully`);

        return {
            success: true,
            data: {
                docType,
                userId,
                isValid: ocrResult.isValid,
                confidence: ocrResult.confidence,
                extractedFields: ocrResult.extractedFields,
                matchResults: ocrResult.matchResults,
                reason: ocrResult.reason,
                newStatus,
            }
        };
    }

    @Post('digilocker/initiate')
    async initiateDigilockerFlow(
        @Body('userId') userId: string,
        @Body('docType') docType: string,
        @Body('redirectUri') redirectUri: string
    ) {
        if (!userId || !docType) {
            throw new BadRequestException('userId and docType are required');
        }

        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const callbackUrl = process.env.DIGILOCKER_CALLBACK_URL || (backendUrl + '/api/digilocker/callback');

        const stateData = { userId, docType, redirectUri, codeVerifier };
        const state = Buffer.from(JSON.stringify(stateData)).toString('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const authUrl = this.digilockerService.getAuthUrl(state, callbackUrl, codeChallenge);

        return { success: true, authUrl };
    }

    @Get('view/:userId/:docType')
    async viewDocument(
        @Param('userId') userId: string,
        @Param('docType') docType: string,
        @Res() res: Response,
    ) {
        const docs = await this.usersService.getUserDocuments(userId);
        const doc = docs.find(d => d.docType === docType);

        if (!doc || !doc.filePath) {
            throw new NotFoundException('Document not found');
        }

        if (doc.filePath && doc.filePath.startsWith('in.gov.')) {
            const html = `<!DOCTYPE html><html><head><title>DigiLocker Record - ${doc.docName || doc.docType}</title>
<style>body{font-family:system-ui,sans-serif;background:#f0f2f5;display:flex;justify-content:center;padding:40px}.card{background:white;padding:40px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);max-width:600px;width:100%;border-top:6px solid #82c91e}.badge{background:#e6fced;color:#12b842;padding:6px 12px;border-radius:20px;font-weight:600;font-size:14px}</style></head>
<body><div class="card"><h2>Digital Verification Record</h2><span class="badge">✓ Verified by DigiLocker</span>
<p><strong>Document:</strong> ${doc.docName || doc.docType}</p>
<p><strong>Reference:</strong> ${doc.filePath}</p></div></body></html>`;
            res.setHeader('Content-Type', 'text/html');
            return res.send(html);
        }

        const absolutePath = resolve(doc.filePath);
        if (!existsSync(absolutePath)) {
            const fallbackPath = resolve(process.cwd(), 'public/mock/document_missing.pdf');
            if (existsSync(fallbackPath)) {
                return res.sendFile(fallbackPath);
            }
            throw new NotFoundException('Document file not found on disk');
        }

        res.sendFile(absolutePath);
    }

    @Get(':userId')
    async getUserDocuments(@Param('userId') userId: string) {
        const documents = await this.usersService.getUserDocuments(userId);
        return { success: true, data: documents };
    }

    @Delete(':userId/:docType')
    async deleteDocument(
        @Param('userId') userId: string,
        @Param('docType') docType: string
    ) {
        const docs = await this.usersService.getUserDocuments(userId);
        const doc = docs.find(d => d.docType === docType);

        if (doc && doc.filePath && existsSync(doc.filePath)) {
            try {
                unlinkSync(doc.filePath);
            } catch (e) {
                console.error('Error deleting file:', e);
            }
        }

        await this.usersService.deleteUserDocument(userId, docType);

        return { success: true, message: 'Document deleted successfully' };
    }
}

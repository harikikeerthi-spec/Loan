
import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, Param, Delete, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '../users/users.service';
import { DigilockerService } from '../integration/digilocker.service';
import { DocumentVerificationService } from '../ai/services/document-verification.service';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import type { Response } from 'express';

// Multer configuration
const storage = diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = './uploads/documents';
        if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
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
            // If validation fails, we might want to delete the file
            unlinkSync(file.path);
            throw new BadRequestException('userId and docType are required');
        }

        // 1. Verify Document (Mock/External Service Check)
        const verificationResult = await this.digilockerService.verifyDocument(file.path, docType);

        let status = 'uploaded';
        let rejectionReason: string | null = null;
        let aiExplanation: string | null = null;

        if (verificationResult.isValid) {
            status = 'verified';
        } else {
            status = 'rejected';
            // 2. If rejected, get AI explanation
            const reason = verificationResult.details?.message || 'Document verification failed';
            rejectionReason = reason;
            aiExplanation = await this.docVerificationService.explainRejection(docType, reason);
        }

        // 3. Update database with verification results
        // Note: The UserDocument schema might need updates to store rejection details if not present.
        // I will assume for now we just use 'status' and maybe store metadata in 'filePath' or separate fields if schema supports it.
        // Checking schema: UserDocument doesn't have 'rejectionReason' or 'aiExplanation'. 
        // ApplicationDocument DOES. 
        // UserDocument has 'status', 'filePath'.
        // So for UserDocument we can only store status.
        // Ideally we should update schema, but I cannot migrate DB right now easily without user permission.
        // So I'll just set status.

        const document = await this.usersService.upsertUserDocument(userId, docType, {
            uploaded: true,
            filePath: file.path,
            status: status
        });

        return {
            success: true,
            data: {
                ...document,
                verification: verificationResult,
                aiExplanation: aiExplanation
            },
            file: {
                originalName: file.originalname,
                filename: file.filename,
                path: file.path
            }
        };
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

        const absolutePath = resolve(doc.filePath);
        if (!existsSync(absolutePath)) {
            throw new NotFoundException('Document file not found on disk');
        }

        res.sendFile(absolutePath);
    }

    @Get(':userId')
    async getUserDocuments(@Param('userId') userId: string) {
        const documents = await this.usersService.getUserDocuments(userId);
        return {
            success: true,
            data: documents
        };
    }

    @Delete(':userId/:docType')
    async deleteDocument(
        @Param('userId') userId: string,
        @Param('docType') docType: string
    ) {
        // First get the document to find the file path
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

        return {
            success: true,
            message: 'Document deleted successfully'
        };
    }
}

import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, Param, Delete, Res, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '../users/users.service';
import { S3Service } from '../s3/s3.service';
import { memoryStorage } from 'multer';
import { extname } from 'path';

@Controller('documents')
export class DocumentController {
    private readonly logger = new Logger(DocumentController.name);

    constructor(
        private usersService: UsersService,
        private s3Service: S3Service
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
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
            throw new BadRequestException('userId and docType are required');
        }

        try {
            const fileExt = extname(file.originalname);
            const key = `documents/${userId}/${docType}-${Date.now()}${fileExt}`;
            
            // Upload to S3
            await this.s3Service.uploadFile(file, key);

            // Update database with S3 key
            const document = await this.usersService.upsertUserDocument(userId, docType, {
                uploaded: true,
                filePath: key,
                status: 'uploaded'
            });

            return {
                success: true,
                data: document,
                file: {
                    originalName: file.originalname,
                    key: key
                }
            };
        } catch (error) {
            this.logger.error(`Failed to upload document: ${error.message}`);
            throw new BadRequestException('Failed to upload document to storage');
        }
    }

    @Get(':userId')
    async getUserDocuments(@Param('userId') userId: string) {
        const documents = await this.usersService.getUserDocuments(userId);
        
        // Add presigned URLs for each document that has a file path
        const documentsWithUrls = await Promise.all(documents.map(async (doc) => {
            if (doc.filePath && (doc.status === 'uploaded' || doc.status === 'verified' || doc.status === 'available_in_digilocker')) {
                try {
                    // Check if it's an S3 key (doesn't start with http/uploads)
                    if (!doc.filePath.startsWith('http') && !doc.filePath.startsWith('uploads/')) {
                        const viewUrl = await this.s3Service.getPresignedUrl(doc.filePath);
                        return { ...doc, viewUrl };
                    }
                } catch (e) {
                    this.logger.error(`Error generating URL for ${doc.filePath}: ${e.message}`);
                }
            }
            return doc;
        }));

        return {
            success: true,
            data: documentsWithUrls
        };
    }

    @Get('view/:userId/:docType')
    async getDocumentUrl(
        @Param('userId') userId: string,
        @Param('docType') docType: string
    ) {
        const docs = await this.usersService.getUserDocuments(userId);
        const doc = docs.find(d => d.docType === docType);

        if (!doc || !doc.filePath) {
            throw new NotFoundException('Document not found');
        }

        try {
            // If it's already a full URL (e.g. from DigiLocker or legacy), return it
            if (doc.filePath.startsWith('http')) {
                return { success: true, url: doc.filePath };
            }

            const url = await this.s3Service.getPresignedUrl(doc.filePath);
            return {
                success: true,
                url: url
            };
        } catch (error) {
            throw new BadRequestException('Could not generate document URL');
        }
    }

    @Delete(':userId/:docType')
    async deleteDocument(
        @Param('userId') userId: string,
        @Param('docType') docType: string
    ) {
        const docs = await this.usersService.getUserDocuments(userId);
        const doc = docs.find(d => d.docType === docType);

        if (doc && doc.filePath) {
            try {
                // Only delete from S3 if it's an S3 key
                if (!doc.filePath.startsWith('http') && !doc.filePath.startsWith('uploads/')) {
                    await this.s3Service.deleteFile(doc.filePath);
                }
            } catch (e) {
                this.logger.error('Error deleting file from S3:', e);
            }
        }

        await this.usersService.deleteUserDocument(userId, docType);

        return {
            success: true,
            message: 'Document deleted successfully'
        };
    }
}

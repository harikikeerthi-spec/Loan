
import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, Param, Delete, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '../users/users.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

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
    constructor(private usersService: UsersService) { }

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

        // Update database
        const document = await this.usersService.upsertUserDocument(userId, docType, {
            uploaded: true,
            filePath: file.path,
            status: 'uploaded'
        });

        return {
            success: true,
            data: document,
            file: {
                originalName: file.originalname,
                filename: file.filename,
                // In a real app, this should be a public URL. 
                // For now, we return the path so the frontend knows it's saved.
                path: file.path
            }
        };
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

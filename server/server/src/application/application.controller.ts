import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { ApplicationService } from './application.service';
import { UserGuard } from '../auth/user.guard';
import { AdminGuard } from '../auth/admin.guard';

// Multer configuration for application documents
const storage = diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = './uploads/applications';
        if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `app-doc-${uniqueSuffix}${ext}`);
    },
});

@Controller('applications')
export class ApplicationController {
    constructor(private applicationService: ApplicationService) { }

    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Track application by application number (public)
     * GET /applications/track/:applicationNumber
     */
    @Get('track/:applicationNumber')
    async trackApplication(@Param('applicationNumber') applicationNumber: string) {
        return this.applicationService.trackApplication(applicationNumber);
    }

    /**
     * Get required documents list for a loan type
     * GET /applications/required-documents/:loanType
     */
    @Get('required-documents/:loanType')
    async getRequiredDocuments(@Param('loanType') loanType: string) {
        return this.applicationService.getRequiredDocuments(loanType);
    }

    /**
     * Get application stages
     * GET /applications/stages
     */
    @Get('stages')
    async getApplicationStages() {
        return this.applicationService.getApplicationStages();
    }

    // ==================== USER ENDPOINTS ====================

    /**
     * Create a new loan application
     * POST /applications
     * @body Complete application data
     */
    @Post()
    @UseGuards(UserGuard)
    async createApplication(@Request() req, @Body() body: any) {
        try {
            console.log('[ApplicationController] Creating application for user:', req.user.id);
            console.log('[ApplicationController] Body:', JSON.stringify(body, null, 2));
            return await this.applicationService.createApplication(req.user.id, body);
        } catch (error) {
            console.error('[ApplicationController] Error creating application:', error);
            throw error;
        }
    }

    /**
     * Get all user's applications
     * GET /applications/my
     * @query status - Filter by status
     * @query loanType - Filter by loan type
     * @query limit - Number of results (default: 20)
     * @query offset - Skip results (default: 0)
     */
    @Get('my')
    @UseGuards(UserGuard)
    async getMyApplications(
        @Request() req,
        @Query('status') status?: string,
        @Query('loanType') loanType?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.applicationService.getUserApplications(req.user.id, {
            status,
            loanType,
            limit: limit ? parseInt(limit, 10) : 20,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }

    /**
     * Get application by ID
     * GET /applications/:id
     */
    @Get(':id')
    @UseGuards(UserGuard)
    async getApplicationById(@Request() req, @Param('id') id: string) {
        const application = await this.applicationService.getApplicationById(id);

        // Verify ownership (unless admin)
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && application.userId !== req.user.id) {
            throw new BadRequestException('Unauthorized to view this application');
        }

        return {
            success: true,
            data: application
        };
    }

    /**
     * Get application tracking/timeline
     * GET /applications/:id/tracking
     */
    @Get(':id/tracking')
    @UseGuards(UserGuard)
    async getApplicationTracking(@Request() req, @Param('id') id: string) {
        return this.applicationService.getApplicationTracking(id, req.user.id);
    }

    /**
     * Update application
     * PUT /applications/:id
     */
    @Put(':id')
    @UseGuards(UserGuard)
    async updateApplication(
        @Request() req,
        @Param('id') id: string,
        @Body() body: any
    ) {
        return this.applicationService.updateApplication(id, req.user.id, body);
    }

    /**
     * Submit a draft application
     * POST /applications/:id/submit
     */
    @Post(':id/submit')
    @UseGuards(UserGuard)
    async submitApplication(@Request() req, @Param('id') id: string) {
        return this.applicationService.submitApplication(id, req.user.id);
    }

    /**
     * Cancel application
     * POST /applications/:id/cancel
     * @body reason - Cancellation reason (optional)
     */
    @Post(':id/cancel')
    @UseGuards(UserGuard)
    async cancelApplication(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { reason?: string }
    ) {
        return this.applicationService.cancelApplication(id, req.user.id, body?.reason);
    }

    /**
     * Delete application
     * DELETE /applications/:id
     */
    @Delete(':id')
    @UseGuards(UserGuard)
    async deleteApplication(@Request() req, @Param('id') id: string) {
        return this.applicationService.deleteApplication(id, req.user.id);
    }

    /**
     * Get documents for an application
     * GET /applications/:id/documents
     */
    @Get(':id/documents')
    @UseGuards(UserGuard)
    async getApplicationDocuments(@Request() req, @Param('id') id: string) {
        return this.applicationService.getApplicationDocuments(id, req.user.id);
    }

    /**
     * Upload document to application
     * POST /applications/:id/documents
     */
    @Post(':id/documents')
    @UseGuards(UserGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: storage,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|pdf|doc|docx)$/)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Unsupported file type. Allowed: jpg, jpeg, png, pdf, doc, docx'), false);
            }
        }
    }))
    async uploadDocument(
        @Request() req,
        @Param('id') applicationId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('docType') docType: string,
        @Body('docName') docName: string,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (!docType) {
            if (file?.path) {
                try { unlinkSync(file.path); } catch (e) { }
            }
            throw new BadRequestException('docType is required');
        }

        return this.applicationService.uploadDocument(applicationId, req.user.id, {
            docType,
            docName: docName || file.originalname,
            fileName: file.filename,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
        });
    }

    /**
     * Delete document from application
     * DELETE /applications/:id/documents/:documentId
     */
    @Delete(':id/documents/:documentId')
    @UseGuards(UserGuard)
    async deleteDocument(
        @Request() req,
        @Param('id') applicationId: string,
        @Param('documentId') documentId: string,
    ) {
        return this.applicationService.deleteDocument(documentId, req.user.id);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all applications (Admin)
     * GET /applications/admin/all
     * @query status - Filter by status
     * @query stage - Filter by stage
     * @query loanType - Filter by loan type
     * @query bank - Filter by bank
     * @query search - Search term
     * @query fromDate - From date
     * @query toDate - To date
     * @query limit - Number of results
     * @query offset - Skip results
     * @query sortBy - Sort field
     * @query sortOrder - Sort order (asc/desc)
     */
    @Get('admin/all')
    @UseGuards(AdminGuard)
    async getAllApplications(
        @Query('status') status?: string,
        @Query('stage') stage?: string,
        @Query('loanType') loanType?: string,
        @Query('bank') bank?: string,
        @Query('search') search?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: string,
    ) {
        return this.applicationService.getAllApplications({
            status,
            stage,
            loanType,
            bank,
            search,
            fromDate,
            toDate,
            limit: limit ? parseInt(limit, 10) : 20,
            offset: offset ? parseInt(offset, 10) : 0,
            sortBy,
            sortOrder: sortOrder as 'asc' | 'desc',
        });
    }

    /**
     * Get application statistics (Admin)
     * GET /applications/admin/stats
     */
    @Get('admin/stats')
    @UseGuards(AdminGuard)
    async getApplicationStats() {
        return this.applicationService.getApplicationStats();
    }

    /**
     * Update application status (Admin)
     * PUT /applications/admin/:id/status
     */
    @Put('admin/:id/status')
    @UseGuards(AdminGuard)
    async updateApplicationStatus(
        @Request() req,
        @Param('id') id: string,
        @Body() body: {
            status?: string;
            stage?: string;
            progress?: number;
            remarks?: string;
            assignedTo?: string;
            sanctionAmount?: number;
            sanctionedInterestRate?: number;
            rejectionReason?: string;
        }
    ) {
        const adminName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
        return this.applicationService.updateApplicationStatus(id, req.user.id, adminName, body);
    }

    /**
     * Get application documents (Admin)
     * GET /applications/admin/:id/documents
     */
    @Get('admin/:id/documents')
    @UseGuards(AdminGuard)
    async getDocumentsAdmin(@Param('id') id: string) {
        return this.applicationService.getApplicationDocuments(id);
    }

    /**
     * Verify/Reject document (Admin)
     * PUT /applications/admin/documents/:documentId/verify
     */
    @Put('admin/documents/:documentId/verify')
    @UseGuards(AdminGuard)
    async verifyDocument(
        @Request() req,
        @Param('documentId') documentId: string,
        @Body() body: {
            status: 'verified' | 'rejected';
            rejectionReason?: string;
        }
    ) {
        return this.applicationService.verifyDocument(documentId, req.user.id, body);
    }

    /**
     * Get application tracking (Admin)
     * GET /applications/admin/:id/tracking
     */
    @Get('admin/:id/tracking')
    @UseGuards(AdminGuard)
    async getTrackingAdmin(@Param('id') id: string) {
        return this.applicationService.getApplicationTracking(id);
    }

    /**
     * Get application notes (Admin)
     * GET /applications/admin/:id/notes
     */
    @Get('admin/:id/notes')
    @UseGuards(AdminGuard)
    async getApplicationNotes(@Param('id') id: string) {
        return this.applicationService.getApplicationNotes(id, true);
    }

    /**
     * Add note to application (Admin)
     * POST /applications/admin/:id/notes
     */
    @Post('admin/:id/notes')
    @UseGuards(AdminGuard)
    async addApplicationNote(
        @Request() req,
        @Param('id') id: string,
        @Body() body: {
            content: string;
            type?: string;
            isInternal?: boolean;
        }
    ) {
        const authorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
        return this.applicationService.addApplicationNote(id, req.user.id, authorName, body);
    }
}

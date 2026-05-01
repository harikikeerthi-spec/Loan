import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { StaffProfileService } from './staff-profile.service';
import { StaffGuard } from '../auth/staff.guard';

const uploadStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = './uploads/staff-documents';
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `staff-${unique}${extname(file.originalname)}`);
  },
});

@UseGuards(StaffGuard)
@Controller('staff-profiles')
export class StaffProfileController {
  constructor(private readonly svc: StaffProfileService) {}

  // ─── List all profiles ─────────────────────────────────────────────────────
  @Get()
  async list(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('bankStatus') bankStatus?: string,
  ) {
    const profiles = await this.svc.listProfiles(req.user, { search, bankStatus });
    return { success: true, data: profiles, total: profiles.length };
  }

  // ─── Create a new staff profile linked to a website user ──────────────────
  @Post()
  async create(@Req() req: any, @Body() body: {
    linked_user_id: string;
    target_bank?: string;
    loan_type?: string;
    internal_notes?: string;
  }) {
    if (!body.linked_user_id) throw new BadRequestException('linked_user_id is required');
    const profile = await this.svc.createProfile(req.user, body);
    return { success: true, data: profile };
  }

  // ─── Get a single profile (with documents) ────────────────────────────────
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const profile = await this.svc.getProfile(id);
    return { success: true, data: profile };
  }

  // ─── Fetch & attach documents from the linked user's account ──────────────
  @Post(':id/fetch-documents')
  async fetchDocs(@Param('id') id: string, @Req() req: any) {
    const result = await this.svc.fetchUserDocuments(id, req.user);
    return { success: true, ...result };
  }

  // ─── Get documents attached to a profile ──────────────────────────────────
  @Get(':id/documents')
  async getDocs(@Param('id') id: string) {
    const docs = await this.svc.getProfileDocuments(id);
    return { success: true, data: docs };
  }

  // ─── Staff manually uploads a document and attaches it ────────────────────
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', {
    storage: uploadStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) cb(null, true);
      else cb(new BadRequestException('Only PDF, JPG, PNG allowed'), false);
    },
  }))
  async uploadDoc(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('doc_type') docType: string,
    @Body('description') description?: string,
  ) {
    if (!docType) throw new BadRequestException('doc_type is required');
    const doc = await this.svc.uploadStaffDocument(id, req.user, file, {
      doc_type: docType,
      description,
    });
    return { success: true, data: doc };
  }

  // ─── Update document status + back-sync to user profile ───────────────────
  @Patch(':id/documents/:docId/status')
  async updateStatus(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Req() req: any,
    @Body() body: { status: string; rejection_reason?: string },
  ) {
    const result = await this.svc.updateDocumentStatus(id, docId, req.user, body);
    return { success: true, data: result };
  }

  // ─── Remove (detach) a document from a profile ────────────────────────────
  @Delete(':id/documents/:docId')
  async removeDoc(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Req() req: any,
  ) {
    return this.svc.removeDocument(id, docId, req.user);
  }

  // ─── Share document bundle with bank ──────────────────────────────────────
  @Post(':id/share')
  async share(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: {
      doc_ids: string[];
      bank_name: string;
      bank_email: string;
      expires_in_days?: number;
      access_note?: string;
    },
  ) {
    const result = await this.svc.shareWithBank(id, req.user, body);
    return { success: true, data: result };
  }

  // ─── Get share history for a profile ──────────────────────────────────────
  @Get(':id/shares')
  async getShares(@Param('id') id: string) {
    const shares = await this.svc.getShareHistory(id);
    return { success: true, data: shares };
  }
}

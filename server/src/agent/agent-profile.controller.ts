import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AgentGuard } from '../auth/agent.guard';
import * as fs from 'fs';
import * as path from 'path';

function getProfilePath() {
  const dir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'agent_profiles.json');
}

function readProfile(agentId: string) {
  const file = getProfilePath();
  if (!fs.existsSync(file)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data[agentId] || {};
  } catch (e) {
    return {};
  }
}

function writeProfile(agentId: string, payload: any) {
  const file = getProfilePath();
  let data: Record<string, any> = {};
  if (fs.existsSync(file)) {
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {}
  }
  data[agentId] = { ...(data[agentId] || {}), ...payload };
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  return data[agentId];
}

@Controller()
@UseGuards(AgentGuard)
export class AgentProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get('agents/me')
  async getMe(@Req() req: any) {
    const user = req.user;
    const profile = readProfile(user.id);
    return {
      success: true,
      data: {
        id: user.id.replace('VL-STU-', 'VL-AGT-'),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber || user.mobile,
        role: user.role,
        businessName: profile.businessName || `${user.firstName || 'Krishna'} Agency`,
        officeAddress: profile.officeAddress || '',
        gstin: profile.gstin || '36AAAAA1111A1Z1',
        kycStatus: profile.kycStatus || 'verified',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  }

  @Post('agents/me/contact')
  async updateContact(@Req() req: any, @Body() body: any) {
    const user = req.user;
    
    // In a real app we'd update the User table for firstName/lastName/mobile/email, 
    // but for the agent portal mock, we'll store overrides in the profile json to reflect instantly.
    const profile = writeProfile(user.id, {
      officeAddress: body.officeAddress,
      // If we wanted to override primary contact name/mobile:
      // firstName: body.primaryContact?.split(' ')[0],
      // lastName: body.primaryContact?.split(' ').slice(1).join(' '),
      // mobile: body.mobile
    });
    
    // Also update actual user table for these fields
    if (body.primaryContact) {
      const parts = body.primaryContact.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      await this.usersService.updateExtractedDetails(user.id, { 
        firstName, 
        lastName,
        mobile: body.mobile,
        phoneNumber: body.mobile
      });
    }

    return { success: true, data: profile };
  }

  @Get('kyc')
  async getKyc(@Req() req: any) {
    const user = req.user;
    const profile = readProfile(user.id);
    return {
      success: true,
      status: profile.kycStatus || 'verified',
      submittedAt: profile.kycSubmittedAt || new Date().toISOString()
    };
  }

  @Post('kyc')
  async submitKyc(@Req() req: any, @Body() body: any) {
    const user = req.user;
    const profile = writeProfile(user.id, {
      kycStatus: 'pending',
      kycSubmittedAt: new Date().toISOString(),
      businessName: body.businessName,
      gstin: body.gstin
    });
    return { success: true, data: profile };
  }

  @Get('kyc/documents')
  async getKycDocuments(@Req() req: any) {
    const user = req.user;
    const docs = await this.usersService.getUserDocuments(user.id);
    return {
      success: true,
      documents: docs.filter(d => 
        d.docType.startsWith('agent_') || 
        d.docType.startsWith('kyc_') || 
        d.docType.includes('pan') || 
        d.docType.includes('aadhar')
      )
    };
  }

  @Get('bank-account')
  async getBankAccount(@Req() req: any) {
    const user = req.user;
    const profile = readProfile(user.id);
    return {
      success: true,
      data: profile.bankAccount || {
        accountNumber: '123456789012',
        bankName: 'SBI',
        ifscCode: 'SBIN0001234'
      }
    };
  }

  @Post('bank-account')
  async updateBankAccount(@Req() req: any, @Body() body: any) {
    const user = req.user;
    const profile = writeProfile(user.id, {
      bankAccount: {
        accountNumber: body.accountNumber,
        bankName: body.bankName,
        ifscCode: body.ifscCode
      }
    });
    return { success: true, data: profile.bankAccount };
  }

  @Get('agreements')
  async getAgreements(@Req() req: any) {
    const user = req.user;
    const profile = readProfile(user.id);
    return {
      success: true,
      agreements: profile.agreements || [
        { id: 'dsa_agreement', name: 'DSA Partnership Agreement', signed: true, signedAt: '2026-06-01T00:00:00Z' },
        { id: 'nda', name: 'Non-Disclosure Agreement', signed: true, signedAt: '2026-06-01T00:00:00Z' }
      ]
    };
  }
}

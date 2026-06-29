import { Injectable, BadRequestException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { extractFullNameFromOcrRaw } from '../ai/utils/ocr-fields.util';
import { SupabaseService } from '../supabase/supabase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EmailService } from '../auth/email.service';

@Injectable()
export class UsersService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private supabase: SupabaseService,
    private eventEmitter: EventEmitter2,
    private emailService: EmailService,
  ) { }

  private parseDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;

    // Try native parsing first (e.g., ISO, YYYY-MM-DD)
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();

    // Try DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      // Simple validation for numbers
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
    }

    return null;
  }

  private safeISO(dateSource: any): string {
    if (!dateSource) return new Date().toISOString();
    const d = dateSource instanceof Date ? dateSource : new Date(dateSource);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  /**
   * Converts a UTC date/time to India Standard Time (IST) format
   * IST is UTC+5:30
   * Returns format: YYYY-MM-DD HH:MM:SS IST
   */
  private convertToIndiaTime(utcDate: string | Date | null | undefined): string | null {
    if (!utcDate) return null;
    
    try {
      const date = utcDate instanceof Date ? utcDate : new Date(utcDate);
      if (isNaN(date.getTime())) return null;

      // Convert to IST (UTC+5:30)
      const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      
      const year = istDate.getUTCFullYear();
      const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(istDate.getUTCDate()).padStart(2, '0');
      const hours = String(istDate.getUTCHours()).padStart(2, '0');
      const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
      const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} IST`;
    } catch (e) {
      console.error('[UsersService.convertToIndiaTime] Error:', e);
      return null;
    }
  }

  private userCache = new Map<string, { user: any; expiresAt: number }>();

  clearCache(email?: string) {
    if (email) {
      this.userCache.delete(email);
    } else {
      this.userCache.clear();
    }
  }

  async findOne(email: string) {
    const now = Date.now();
    const cached = this.userCache.get(email);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    try {
      const { data, error } = await this.db.from('User').select('*').eq('email', email).single();
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error(`[UsersService.findOne] Supabase error for ${email}:`, error);
      }
      if (data) {
        this.userCache.set(email, { user: data, expiresAt: now + 15000 }); // Cache for 15 seconds
      }
      return data;
    } catch (e) {
      console.error(`[UsersService.findOne] Fatal error for ${email}:`, e);
      throw e;
    }
  }

  async findById(id: string) {
    const { data } = await this.db.from('User').select('*').eq('id', id).single();
    return data;
  }

  async findByMobile(mobile: string) {
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanMobileNoCountry =
      cleanMobile.length > 10 && cleanMobile.startsWith('91')
        ? cleanMobile.substring(2)
        : cleanMobile;

    const { data } = await this.db
      .from('User')
      .select('*')
      .or(
        `mobile.eq.${mobile},phoneNumber.eq.${mobile},mobile.eq.${cleanMobileNoCountry},phoneNumber.eq.${cleanMobileNoCountry},mobile.ilike.%${cleanMobileNoCountry},phoneNumber.ilike.%${cleanMobileNoCountry}`,
      )
      .limit(1)
      .single();
    return data;
  }

  /**
   * Generate the next sequential student/user ID
   * Returns format: VL-STU-{YEAR}-{5-digit sequential}
   * Properly handles numeric sorting to find the highest sequential number
   */
  private async generateSequentialStudentId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VL-STU-${year}-`;

    try {
      // Fetch all student IDs for this year
      const { data: allIds, error } = await this.db
        .from('User')
        .select('id')
        .like('id', `${prefix}%`);

      if (error) {
        console.error('[UsersService] Error fetching student IDs:', error);
      }

      let nextSeq = 1;

      if (allIds && allIds.length > 0) {
        // Extract numeric suffixes and find the maximum
        const numericIds = allIds
          .map(u => {
            const suffix = u.id.substring(prefix.length);
            const num = parseInt(suffix, 10);
            return isNaN(num) ? 0 : num;
          })
          .filter(n => n > 0);

        if (numericIds.length > 0) {
          nextSeq = Math.max(...numericIds) + 1;
        }
      }

      return `${prefix}${String(nextSeq).padStart(5, '0')}`;
    } catch (err) {
      console.error('[UsersService] Failed to generate sequential student ID, falling back to random:', err);
      const seq = String(Math.floor(Math.random() * 100_000)).padStart(5, '0');
      return `${prefix}${seq}`;
    }
  }

  /**
   * Generate sequential staff ID with format VL-STF-{3-digit}
   * Fetches the highest existing staff ID and increments by 1
   */
  private async generateSequentialStaffId(): Promise<string> {
    const prefix = 'VL-STF-';

    try {
      // Fetch all staff IDs — if staffId column doesn't exist in schema cache
      // (PGRST204), fall through to the catch block and use a random ID
      const { data: allIds, error } = await this.db
        .from('User')
        .select('staffId')
        .not('staffId', 'is', null)
        .like('staffId', `${prefix}%`);

      if (error) {
        if (error.code === 'PGRST204') {
          console.warn('[UsersService] staffId column not in schema cache — using random staff ID fallback');
          const seq = String(Math.floor(Math.random() * 1_000)).padStart(3, '0');
          return `${prefix}${seq}`;
        }
        console.error('[UsersService] Error fetching staff IDs:', error);
      }

      let nextSeq = 1;

      if (allIds && allIds.length > 0) {
        // Extract numeric suffixes and find the maximum
        const numericIds = allIds
          .map(u => {
            if (!u.staffId) return 0;
            const suffix = u.staffId.substring(prefix.length);
            const num = parseInt(suffix, 10);
            return isNaN(num) ? 0 : num;
          })
          .filter(n => n > 0);

        if (numericIds.length > 0) {
          nextSeq = Math.max(...numericIds) + 1;
        }
      }

      return `${prefix}${String(nextSeq).padStart(3, '0')}`;
    } catch (err) {
      console.error('[UsersService] Failed to generate sequential staff ID, falling back to random:', err);
      const seq = String(Math.floor(Math.random() * 1_000)).padStart(3, '0');
      return `${prefix}${seq}`;
    }
  }

  /**
   * djb2 hash of an email → stable fixed-width numeric suffix.
   * Same email always produces the same number.
   * Used for agents and banks.
   */
  private emailToNum(email: string, digits: number): string {
    let hash = 5381;
    const lower = email.toLowerCase().trim();
    for (let i = 0; i < lower.length; i++) {
      hash = ((hash << 5) + hash + lower.charCodeAt(i)) >>> 0; // unsigned 32-bit
    }
    const max = Math.pow(10, digits);
    return String(hash % max).padStart(digits, '0');
  }

  /**
   * Generate a role-based user ID:
   *  - student / user  →  VL-STU-{YEAR}-{5-digit sequential}
   *  - staff           →  VL-STF-{3-digit sequential}
   *  - agent           →  VL-AGT-{5-digit from email}
   *  - bank            →  VL-BNK-{3-digit from email}
   *
   * Students/users get sequential IDs. Staff get sequential staff IDs. Agents/banks use email-derived hash.
   */
  private generateNonStudentUserId(role?: string, email?: string): string {
    if (email) {
      if (role === 'agent') return `VL-AGT-${this.emailToNum(email, 5)}`;
      if (role === 'bank')  return `VL-BNK-${this.emailToNum(email, 3)}`;
    }

    // Fallback: random (no email supplied)
    const seq5 = String(randomInt(0, 100_000)).padStart(5, '0');
    if (role === 'agent') return `VL-AGT-${seq5}`;
    if (role === 'bank')  return `VL-BNK-${String(randomInt(0, 1_000)).padStart(3, '0')}`;
    return `VL-AGT-${seq5}`; // default fallback
  }

  private async createUniqueUserId(role?: string, email?: string): Promise<string> {
    const effectiveRole = role || 'user';

    // Students/users get sequential IDs
    if (effectiveRole === 'user' || effectiveRole === 'student') {
      return await this.generateSequentialStudentId();
    }

    // Staff get sequential staff IDs
    if (effectiveRole === 'staff') {
      return await this.generateSequentialStaffId();
    }

    // Agents and banks use email-derived approach
    if (email) {
      const id = this.generateNonStudentUserId(effectiveRole, email);
      const existing = await this.findById(id);
      if (!existing) return id;
      // Hash collision – fall through to random
      console.warn(`[UsersService] Hash collision for email ${email}, falling back to random ID`);
    }

    // Fallback: random IDs for agents/banks
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const id = this.generateNonStudentUserId(effectiveRole);
      const existing = await this.findById(id);
      if (!existing) return id;
    }
    throw new Error('Unable to generate a unique user ID');
  }

  async create(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    mobile?: string;
    password?: string;
    role?: string;
  }) {
    const dobDate = this.parseDate(data.dateOfBirth);
    const now = new Date();
    const registeredAtIndia = this.convertToIndiaTime(now);
    const id = await this.createUniqueUserId(data.role, data.email);

    // Generate staff ID if role is 'staff'
    let staffId: string | null = null;
    if (data.role === 'staff') {
      staffId = await this.generateSequentialStaffId();
      console.log(`[UsersService.create] Generated staff ID: ${staffId} for email: ${data.email}`);
    }

    // Build the insert payload — only include staffId for staff users to avoid
    // PGRST204 ("staffId column not found in schema cache") for regular users
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let referralCode = '';
    let exists = true;
    while (exists) {
      let code = 'VL-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const { data: existing } = await this.db.from('User').select('id').eq('referralCode', code).single();
      if (!existing) {
        referralCode = code;
        exists = false;
      }
    }

    const insertPayload: any = {
      id,
      email: data.email,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      phoneNumber: data.phoneNumber || null,
      dateOfBirth: dobDate,
      mobile: data.mobile || '',
      password: data.password || '',
      role: data.role || 'user',
      registeredAtIndia: registeredAtIndia,
      referralCode,
    };

    if (data.role === 'staff' && staffId) {
      insertPayload.staffId = staffId;
    }

    const { data: user, error } = await this.db
      .from('User')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log('User created in DB:', { user, keys: Object.keys(user || {}), hasId: !!user?.id, staffId: user?.staffId });
    return user;
  }

  async findAll(limit?: number, offset?: number, search?: string, role?: string, excludeRoles?: string[]) {
    let query = this.db.from('User').select('*', { count: 'exact' });
    
    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role && role !== 'all') {
      if (role === 'student') {
        query = query.or('role.eq.student,role.eq.user');
      } else if (role === 'staff') {
        query = query.or('role.eq.staff,role.eq.staff_admin');
      } else if (role === 'admin') {
        query = query.or('role.eq.admin,role.eq.super_admin');
      } else {
        query = query.eq('role', role);
      }
    }

    if (excludeRoles && excludeRoles.length > 0) {
      query = query.not('role', 'in', `(${excludeRoles.join(',')})`);
    }

    query = query.order('createdAt', { ascending: false });

    if (limit !== undefined) {
      const from = offset || 0;
      const to = from + limit - 1;
      query = query.range(from, to);
    }
    
    const { data, count, error } = await query;
    if (error) throw error;
    
    return {
      data: data || [],
      total: count || 0
    };
  }

  async getUserStats() {
    const { count: total } = await this.db.from('User').select('*', { count: 'exact', head: true });
    const { count: student } = await this.db.from('User').select('*', { count: 'exact', head: true }).or('role.eq.student,role.eq.user');
    const { count: bank } = await this.db.from('User').select('*', { count: 'exact', head: true }).eq('role', 'bank');
    const { count: staff } = await this.db.from('User').select('*', { count: 'exact', head: true }).or('role.eq.staff,role.eq.staff_admin');
    const { count: admin } = await this.db.from('User').select('*', { count: 'exact', head: true }).or('role.eq.admin,role.eq.super_admin');
    
    return {
      total: total || 0,
      student: student || 0,
      bank: bank || 0,
      staff: staff || 0,
      admin: admin || 0,
      other: (total || 0) - (student || 0) - (bank || 0) - (staff || 0) - (admin || 0)
    };
  }

  async updateUserDetails(
    email: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    dateOfBirth: string,
    intakeSeason?: string,
  ) {
    const dobDate = this.parseDate(dateOfBirth);

    const updatePayload: any = { firstName, lastName, phoneNumber, dateOfBirth: dobDate };
    if (intakeSeason !== undefined) {
      updatePayload.intakeSeason = intakeSeason;
    }

    const { data, error } = await this.db
      .from('User')
      .update(updatePayload)
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    this.clearCache(email);
    return data;
  }

  async updateExtractedDetails(userId: string, details: any, docType?: string) {
    try {
      console.log(`[UsersService.updateExtractedDetails] Updating details for user: ${userId}`);
      
      const currentUser = await this.findById(userId);
      if (!currentUser) {
        console.warn(`[UsersService.updateExtractedDetails] User not found: ${userId}`);
        return { success: false, error: 'User not found' };
      }

      const payload: any = {};
      
      const compareAndSet = (currentVal: any, newVal: any, key: string) => {
        if (newVal === undefined || newVal === null) return;
        const cleanCurrent = String(currentVal || '').trim().toLowerCase();
        const cleanNew = String(newVal).trim().toLowerCase();
        if (!currentVal || cleanCurrent !== cleanNew) {
          payload[key] = newVal;
        }
      };
      
      if (details.documentVerified !== undefined) {
        if (currentUser.documentVerified !== details.documentVerified) {
          payload.documentVerified = details.documentVerified;
        }
      }

      // We no longer automatically fill firstName, lastName, dob, phone, aadhaar, pan, etc.,
      // directly on document upload. The Staff Dashboard manually handles autofill
      // by sending a PUT request after reviewing the OCR data.

      if (Object.keys(payload).length === 0) {
        console.log('[UsersService.updateExtractedDetails] No fields to update.');
        return { success: true };
      }

      const { data, error } = await this.db
        .from('User')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        // If it's a "column does not exist" error (PGRST204), log it but don't fail
        if (error.code === 'PGRST204' || error.message.includes('column')) {
          console.warn(`[UsersService.updateExtractedDetails] Could not update some fields because columns are missing in DB: ${error.message}`);
          
          // Try updating ONLY the verified columns we know exist
          const safePayload: any = {};
          if (payload.firstName) safePayload.firstName = payload.firstName;
          if (payload.lastName) safePayload.lastName = payload.lastName;
          if (payload.dateOfBirth) safePayload.dateOfBirth = payload.dateOfBirth;
          if (payload.gender) safePayload.gender = payload.gender;
          
          if (Object.keys(safePayload).length > 0) {
            await this.db.from('User').update(safePayload).eq('id', userId);
          }
          
          return { success: true, warning: 'Some fields skipped due to missing columns' };
        }
        throw error;
      }

      return { success: true, data };
    } catch (e: any) {
      console.error(`[UsersService.updateExtractedDetails] Failed to update user details: ${e.message}`);
      // Return success anyway so the document upload isn't considered a failure
      return { success: false, error: e.message };
    }
  }

  async updateRefreshToken(email: string, refreshToken: string | null) {
    const { data, error } = await this.db
      .from('User')
      .update({ refreshToken })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    this.clearCache(email);
    return data;
  }

  async updateUserRole(email: string, role: 'admin' | 'user' | 'staff' | 'super_admin' | 'agent' | 'bank' | 'student') {
    // If changing to staff role, generate a staff ID if not already present
    let updatePayload: any = { role };
    
    if (role === 'staff') {
      // Check if user already has a staff ID
      const existingUser = await this.findOne(email);
      if (existingUser && !existingUser.staffId) {
        // Generate new staff ID only if they don't have one
        updatePayload.staffId = await this.generateSequentialStaffId();
        console.log(`[UsersService.updateUserRole] Generated staff ID for ${email}: ${updatePayload.staffId}`);
      }
    }

    const { data, error } = await this.db
      .from('User')
      .update(updatePayload)
      .eq('email', email)
      .select()
      .single();

    if (error) {
      // If staffId column isn't in schema cache, retry without it
      if (error.code === 'PGRST204' && updatePayload.staffId) {
        console.warn(`[UsersService.updateUserRole] staffId column not in schema cache — retrying without staffId`);
        const { staffId: _removed, ...payloadWithoutStaffId } = updatePayload;
        const { data: retryData, error: retryError } = await this.db
          .from('User')
          .update(payloadWithoutStaffId)
          .eq('email', email)
          .select()
          .single();
        if (retryError) throw retryError;
        this.clearCache(email);
        return retryData;
      }
      throw error;
    }
    this.clearCache(email);
    return data;
  }

  private async validateApplicationConstraints(userId: string, bank: string | null | undefined, country: string | null | undefined, universityName: string | null | undefined) {
    const { data: existingApps, error } = await this.db
      .from('LoanApplication')
      .select('id, bank, country, universityName, status')
      .eq('userId', userId)
      .neq('status', 'cancelled');

    if (error) throw error;

    // 1. Limit to 5 applications
    if (existingApps && existingApps.length >= 5) {
      throw new BadRequestException('You cannot have more than 5 active/pending loan applications.');
    }

    // 2. Check duplicate details for the same bank
    if (bank && country && universityName) {
      const duplicate = existingApps?.find(app => {
        const matchBank = app.bank && bank && app.bank.toLowerCase().trim() === bank.toLowerCase().trim();
        const matchCountry = app.country && country && app.country.toLowerCase().trim() === country.toLowerCase().trim();
        const matchUniversity = app.universityName && universityName && app.universityName.toLowerCase().trim() === universityName.toLowerCase().trim();
        return matchBank && matchCountry && matchUniversity;
      });

      if (duplicate) {
        throw new BadRequestException(`An active application to ${bank} for ${universityName} in ${country} already exists. To apply to the same bank, please use different details (e.g., country or university).`);
      }
    }
  }

  public async generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VL-APP-${year}-`;
    
    try {
      const { data, error } = await this.db
        .from('LoanApplication')
        .select('applicationNumber')
        .like('applicationNumber', `${prefix}%`)
        .order('applicationNumber', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[UsersService] Error fetching max application number:', error);
      }

      let nextSeq = 1;
      if (data && data.applicationNumber) {
        const parts = data.applicationNumber.split('-');
        if (parts.length === 4) {
          const currentSeq = parseInt(parts[3], 10);
          if (!isNaN(currentSeq)) {
            nextSeq = currentSeq + 1;
          }
        }
      }
      return `${prefix}${String(nextSeq).padStart(5, '0')}`;
    } catch (err) {
      console.error('[UsersService] Failed to generate sequential application number, falling back to random:', err);
      const seq = String(Math.floor(Math.random() * 100_000)).padStart(5, '0');
      return `${prefix}${seq}`;
    }
  }

  // Loan Application Methods
  async createLoanApplication(
    userId: string,
    data: {
      bank: string;
      loanType: string;
      amount: number;
      purpose?: string;
      courseType?: string;
      courseName?: string;
      program?: string;
      programFocus?: string;
      country?: string;
      university?: string;
      universityName?: string;
      targetUniversity?: string;
      annualFee?: string;
      livingCost?: string;
      coApplicant?: string;
      income?: string;
      collateral?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dateOfBirth?: string;
      address?: string;
      notes?: string;
      intakeSeason?: string;
    },
  ) {
    const universityName = data.universityName || data.targetUniversity || data.university || null;
    const country = data.country || null;
    const bank = data.bank || null;

    await this.validateApplicationConstraints(userId, bank, country, universityName);

    const now = new Date().toISOString();
    
    // Generate application number: VL-APP-{YEAR}-{5-digit}
    const applicationNumber = await this.generateApplicationNumber();
    
    // Calculate estimated completion (14 days from now)
    const estimatedCompletionAt = new Date();
    estimatedCompletionAt.setDate(estimatedCompletionAt.getDate() + 14);
    
    const courseName = data.courseName || data.programFocus || data.program || data.courseType || null;

    const { data: application, error } = await this.db
      .from('LoanApplication')
      .insert({
        applicationNumber,
        userId,
        bank: data.bank,
        loanType: data.loanType,
        amount: data.amount,
        purpose: data.purpose || null,
        universityName,
        country: data.country || null,
        courseName,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email || null,
        phone: data.phone || null,
        dateOfBirth: this.parseDate(data.dateOfBirth),

        address: data.address || null,
        hasCoApplicant: !!data.coApplicant && data.coApplicant !== 'none',
        coApplicantRelation: data.coApplicant !== 'none' ? data.coApplicant : null,
        coApplicantIncome: data.income ? parseFloat(data.income) : null,
        hasCollateral: !!data.collateral && data.collateral !== 'no',
        collateralType: data.collateral !== 'no' ? data.collateral : null,
        remarks: data.notes || null,
        status: 'submitted',
        stage: 'application_submitted',
        progress: 10,
        submittedAt: now,
        estimatedCompletionAt: estimatedCompletionAt.toISOString(),
        updatedAt: now,
      })
      .select('*, user:User!userId(id, email, firstName, lastName, tests)')
      .single();

    if (error) throw error;

    // Sync target intake and destination to User profile
    if (userId && (data.intakeSeason || data.country)) {
      try {
        await this.db
          .from('User')
          .update({
            ...(data.intakeSeason ? { intakeSeason: data.intakeSeason } : {}),
            ...(data.country ? { studyDestination: data.country } : {}),
          })
          .eq('id', userId);
      } catch (err) {
        console.error('Failed to sync target intake/destination to User profile in createLoanApplication:', err);
      }
    }

    // Emit application created event for staff notifications
    try {
      const name = `${application.firstName || ''} ${application.lastName || ''}`.trim() || application.email || 'Student';
      this.eventEmitter.emit('application.created', {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        userId: application.userId,
        candidateName: name,
        candidateEmail: application.email,
        bank: application.bank,
        loanAmount: application.amount,
        loanType: data.loanType,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to emit application.created event in UsersService:', e);
    }

    // Emit live dashboard activity event for new application creation!
    try {
      const name = `${application.firstName || ''} ${application.lastName || ''}`.trim() || application.email || 'Student';
      const targetUni = application.universityName || 'Target University';
      this.eventEmitter.emit('dashboard.activity', {
        type: 'application',
        msg: `Student ${name} submitted a new Loan Application #${application.applicationNumber} for ${targetUni}.`,
        icon: 'assignment',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        actorName: name,
        actorEmail: application.email,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to emit activity event for application creation in UsersService:', e);
    }

    // Send loan submission email to the student
    try {
      const email = application.user?.email || application.email;
      if (email) {
        const firstName = application.firstName || application.user?.firstName || '';
        const lastName = application.lastName || application.user?.lastName || '';
        const userName = `${firstName} ${lastName}`.trim() || 'Student';
        const bankName = application.bank || 'our partner bank';
        await this.emailService.sendLoanSubmissionEmail(email, userName, bankName, application);
      }
    } catch (e) {
      console.error('Failed to send loan submission email on application creation in UsersService:', e);
    }

    // Send loan tracking email to the registered student email
    try {
      const registeredEmail = application.user?.email || application.email;
      if (registeredEmail) {
        const firstName = application.user?.firstName || application.firstName || '';
        const lastName = application.user?.lastName || application.lastName || '';
        const userName = `${firstName} ${lastName}`.trim() || 'Student';
        const bankName = application.bank || 'our partner bank';
        await this.emailService.sendLoanTrackingEmail(registeredEmail, userName, bankName, application);
      }
    } catch (e) {
      console.error('Failed to send loan tracking email on application creation in UsersService:', e);
    }

    return application;
  }

  async getUserApplications(userId: string) {
    // Also try to find applications by email as a fallback
    const user = await this.findById(userId);
    const email = user?.email;

    let query = this.db
      .from('LoanApplication')
      .select('*')
      .order('id', { ascending: false });

    if (email) {
      query = query.or(`userId.eq.${userId},email.eq.${email}`);
    } else {
      query = query.eq('userId', userId);
    }

    const { data } = await query;
    return data || [];
  }

  async updateLoanApplicationStatus(applicationId: string, status: string) {
    const { data, error } = await this.db
      .from('LoanApplication')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLoanApplication(applicationId: string) {
    const { error } = await this.db
      .from('LoanApplication')
      .delete()
      .eq('id', applicationId);
    if (error) throw error;
    return { success: true };
  }

  // Document Methods
  async upsertUserDocument(
    userId: string,
    docType: string,
    data: {
      uploaded: boolean;
      status?: string;
      filePath?: string;
      digilockerTxId?: string;
      verifiedAt?: Date;
      verificationMetadata?: any;
    },
  ) {
    const existing = await this.db
      .from('UserDocument')
      .select('id, filePath, uploadedAt, verificationMetadata')
      .eq('userId', userId)
      .eq('docType', docType)
      .single();

    if (existing.error && existing.error.code !== 'PGRST116') {
      console.error(`[UsersService.upsertUserDocument] Lookup error for ${userId}/${docType}:`, existing.error);
      throw existing.error;
    }

    const existingMetadata = existing.data?.verificationMetadata || {};
    const incomingMetadata = data.verificationMetadata;
    const mergedMetadata = incomingMetadata !== undefined
      ? {
          ...(typeof incomingMetadata === 'object' && incomingMetadata !== null ? incomingMetadata : {}),
          ...((existingMetadata as any)?.docName && !(incomingMetadata as any)?.docName
            ? { docName: (existingMetadata as any).docName }
            : {}),
        }
      : undefined;

    const payload: any = {
      uploaded: data.uploaded,
      status: data.status || 'pending',
      filePath: data.filePath !== undefined ? data.filePath : (existing.data?.filePath || null),
      uploadedAt: data.uploaded ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    if (data.digilockerTxId !== undefined) payload.digilockerTxId = data.digilockerTxId;
    if (data.verifiedAt !== undefined) payload.verifiedAt = data.verifiedAt?.toISOString();
    if (mergedMetadata !== undefined) payload.verificationMetadata = mergedMetadata;

    if (existing.data) {
      const { data: updated, error } = await this.db
        .from('UserDocument')
        .update(payload)
        .eq('id', existing.data.id)
        .select()
        .single();
      if (error) {
        console.error(`[UsersService.upsertUserDocument] Update error for ${userId}/${docType}:`, error);
        throw error;
      }
      return updated;
    } else {
      // For new records, we need an ID since it doesn't have a default in DB
      const id = `${userId}_${docType}_${Date.now()}`;
      const { data: created, error } = await this.db
        .from('UserDocument')
        .insert({ id, userId, docType, ...payload })
        .select()
        .single();
      if (error) {
        console.error(`[UsersService.upsertUserDocument] Insert error for ${userId}/${docType}:`, error);
        throw error;
      }
      return created;
    }
  }

  async getUserDocuments(userId: string) {
    const { data } = await this.db
      .from('UserDocument')
      .select('*')
      .eq('userId', userId)
      .order('docType', { ascending: true });
    return data || [];
  }

  async deleteUserDocument(userId: string, docType: string) {
    const { error } = await this.db
      .from('UserDocument')
      .delete()
      .eq('userId', userId)
      .eq('docType', docType);
    if (error) throw error;
    return { success: true };
  }
  async updateDocumentStatus(docId: string, status: string, rejectionReason?: string) {
    const payload: any = {
      status,
      updatedAt: new Date().toISOString(),
    };
    
    if (status === 'verified') {
      payload.verifiedAt = new Date().toISOString();
      payload.rejectionReason = null;
      // Clear any previous rejection data
      payload.verificationMetadata = {
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        message: 'Document manually verified by staff',
      };
    }
    
    if (status === 'rejected' && rejectionReason) {
      payload.verifiedAt = null;
      payload.rejectionReason = rejectionReason;
      // Store rejection reason inside the existing verificationMetadata JSON column
      payload.verificationMetadata = {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason,
        message: `Document rejected by staff: ${rejectionReason}`,
      };
    }

    const { data, error } = await this.db
      .from('UserDocument')
      .update(payload)
      .eq('id', docId)
      .select()
      .single();

    if (error) {
      console.error(`[UsersService.updateDocumentStatus] Error updating document ${docId}:`, error);
      throw error;
    }

    // Emit events for real-time student notifications
    if (data) {
      const docName = data.verificationMetadata?.docName || data.docType;
      if (status === 'rejected') {
        this.eventEmitter.emit('document.rejected', {
          userId: data.userId,
          documentId: data.id,
          documentType: data.docType,
          documentName: docName,
          rejectionReason: rejectionReason,
          rejectedAt: payload.verificationMetadata.rejectedAt,
        });
      } else if (status === 'verified') {
        this.eventEmitter.emit('document.verified', {
          userId: data.userId,
          documentId: data.id,
          documentType: data.docType,
          documentName: docName,
          verifiedAt: payload.verifiedAt,
        });
      }
    }

    return data;
  }
  // Get user dashboard data with all applications, documents and full activity feed
  async getUserDashboardData(userId: string) {
    try {
      const applications = await this.getUserApplications(userId) || [];
      const documents = await this.getUserDocuments(userId) || [];

      const { data: userWithActivity } = await this.db
        .from('User')
        .select(
          `*, eligibilityChecks:LoanEligibilityCheck(*), visaMockInterviews:VisaMockInterviewResult(*), forumPosts:ForumPost(*), forumComments:ForumComment(*), universityInquiries:UniversityInquiry(*)`,
        )
        .eq('id', userId)
        .single();

      const inquiries = userWithActivity?.universityInquiries || [];

      const activity: Array<{
        type: string;
        title: string;
        description: string;
        timestamp: string;
        link?: string;
      }> = [];

      for (const app of applications) {
        const ts = app.submittedAt || app.date;
        activity.push({
          type: 'application',
          title: `Loan Application — ${app.bank}`,
          description: `₹${(app.amount || 0).toLocaleString('en-IN')} ${app.loanType || ''}${app.universityName ? ` for ${app.universityName}` : ''}. Status: ${app.status || 'pending'}`,
          timestamp: this.safeISO(ts),
          link: '/dashboard',
        });
      }

      for (const doc of documents) {
        if (doc.uploaded) {
          const ts = doc.uploadedAt || doc.createdAt;
          activity.push({
            type: 'upload',
            title: `Document Uploaded`,
            description: `${(doc.docType || '').replace('_', ' ')} uploaded successfully`,
            timestamp: this.safeISO(ts),
            link: '/document-vault',
          });
        }
      }

      for (const inq of inquiries) {
        activity.push({
          type: inq.type === 'callback' ? 'callback' : 'inquiry',
          title: inq.type === 'callback' ? 'Callback Requested' : 'Fasttrack Application',
          description: `University: ${inq.universityName || 'N/A'}. Status: ${inq.status || 'pending'}`,
          timestamp: this.safeISO(inq.createdAt),
          link: '/explore',
        });
      }

      if (userWithActivity?.eligibilityChecks) {
        for (const check of userWithActivity.eligibilityChecks) {
          activity.push({
            type: 'eligibility',
            title: `Eligibility Result: ${check.status || 'Success'}`,
            description: `Score: ${check.score || 0}% for loan of ₹${(check.loan || 0).toLocaleString('en-IN')}`,
            timestamp: this.safeISO(check.createdAt),
            link: '/loan-eligibility',
          });
        }
      }

      if (userWithActivity?.visaMockInterviews) {
        for (const interview of userWithActivity.visaMockInterviews) {
          activity.push({
            type: 'visa_mock',
            title: `Visa Mock Interview — ${interview.visaType || 'F1'}`,
            description: `Likelihood: ${interview.approvalLikelihood || 'High'}. Risk: ${interview.overallRisk || 'Low'}. Score: ${interview.overallScore || 0}/10`,
            timestamp: this.safeISO(interview.createdAt),
            link: '/visa-mock',
          });
        }
      }

      if (userWithActivity?.forumPosts) {
        for (const post of userWithActivity.forumPosts) {
          activity.push({
            type: 'forum_post',
            title: `Forum Post: ${post.title || 'Untitled'}`,
            description: (post.content || '').substring(0, 100) + '...',
            timestamp: this.safeISO(post.createdAt),
            link: `/community/forum/${post.id}`,
          });
        }
      }

      if (userWithActivity?.forumComments) {
        for (const comment of userWithActivity.forumComments) {
          activity.push({
            type: 'forum_comment',
            title: `Commented on Forum`,
            description: (comment.content || '').substring(0, 100) + '...',
            timestamp: this.safeISO(comment.createdAt),
            link: `/community/forum/${comment.postId}`,
          });
        }
      }


      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const sanitizedUser = userWithActivity ? { ...userWithActivity } : null;
      if (sanitizedUser) {
        delete sanitizedUser.password;
        delete sanitizedUser.refreshToken;
      }

      return {
        applications,
        documents,
        activity: activity.slice(0, 15),
        applicationCount: applications.length,
        user: sanitizedUser,
      };
    } catch (error) {
      console.error('Error in getUserDashboardData:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    const { error } = await this.db
      .from('User')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error(`[UsersService.deleteUser] Error deleting user ${userId}:`, error);
      throw error;
    }
    
    return { success: true };
  }

  async updateUserStatus(userId: string, status: string, rejectionReason?: string) {
    const { data, error } = await this.db
      .from('User')
      .update({
        status,
        rejectionReason: status === 'rejected' ? (rejectionReason || null) : null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`[UsersService.updateUserStatus] Error updating status for user ${userId}:`, error);
      throw error;
    }

    this.clearCache();
    return data;
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { extractFullNameFromOcrRaw } from '../ai/utils/ocr-fields.util';
import { SupabaseService } from '../supabase/supabase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EmailService } from '../auth/email.service';

export const USER_VALID_COLUMNS = new Set([
  'id',
  'email',
  'firstName',
  'lastName',
  'phoneNumber',
  'dateOfBirth',
  'mobile',
  'password',
  'refreshToken',
  'referralCode',
  'referredById',
  'role',
  'createdAt',
  'updatedAt',
  'goal',
  'studyDestination',
  'courseName',
  'targetUniversity',
  'intakeSeason',
  'bachelorsDegree',
  'workExp',
  'gpa',
  'entranceTest',
  'entranceScore',
  'englishTest',
  'englishScore',
  'budget',
  'pincode',
  'loanAmount',
  'admitStatus',
  'tests'
]);

export function sanitizeUserPayload(payload: any): Record<string, any> {
  if (!payload || typeof payload !== 'object') return {};
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (USER_VALID_COLUMNS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

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
    const trimmed = String(dateStr).trim();
    if (!trimmed) return null;

    // Try DD-MM-YYYY or DD/MM/YYYY
    const parts = trimmed.split(/[-/]/);
    if (parts.length === 3) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      const p3 = parseInt(parts[2], 10);

      if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
        if (p3 > 1000) {
          // DD-MM-YYYY
          const d = new Date(Date.UTC(p3, p2 - 1, p1));
          if (!isNaN(d.getTime())) return d.toISOString();
        } else if (p1 > 1000) {
          // YYYY-MM-DD
          const d = new Date(Date.UTC(p1, p2 - 1, p3));
          if (!isNaN(d.getTime())) return d.toISOString();
        }
      }
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.toISOString();

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
    if (!email || !email.trim()) return null;
    const cleanEmail = email.trim().toLowerCase();

    const now = Date.now();
    const cached = this.userCache.get(cleanEmail) || this.userCache.get(email);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    try {
      const { data, error } = await this.db.from('User').select('*').ilike('email', cleanEmail).maybeSingle();
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error(`[UsersService.findOne] Supabase error for ${cleanEmail}:`, error);
      }
      if (data) {
        this.userCache.set(cleanEmail, { user: data, expiresAt: now + 15000 }); // Cache for 15 seconds
      }
      return data;
    } catch (e) {
      console.error(`[UsersService.findOne] Fatal error for ${email}:`, e);
      return null;
    }
  }

  async findById(id: string) {
    const { data } = await this.db.from('User').select('*').eq('id', id).single();
    if (data) {
      const { data: parents } = await this.db.from('parents').select('*').eq('userId', id);
      data.parents = parents || [];
    }
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
      if (role === 'bank') return `VL-BNK-${this.emailToNum(email, 3)}`;
    }

    // Fallback: random (no email supplied)
    const seq5 = String(randomInt(0, 100_000)).padStart(5, '0');
    if (role === 'agent') return `VL-AGT-${seq5}`;
    if (role === 'bank') return `VL-BNK-${String(randomInt(0, 1_000)).padStart(3, '0')}`;
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
      let code = '';
      for (let i = 0; i < 8; i++) {
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

    // Insert into referral_codes table
    try {
      await this.db.from('referral_codes').insert({
        code: referralCode,
        userId: user.id,
      });
    } catch (err) {
      console.error('[UsersService.create] Failed to populate referral_codes table:', err);
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
    } else {
      query = query.or('role.eq.bank,role.eq.staff,role.eq.staff_admin');
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
    try {
      const { data: users } = await this.db
        .from('User')
        .select('role')
        .or('role.eq.bank,role.eq.staff,role.eq.staff_admin');

      const all = users || [];
      const bank = all.filter((u: any) => u.role === 'bank').length;
      const staff = all.filter((u: any) => u.role === 'staff' || u.role === 'staff_admin').length;
      const total = bank + staff;

      return {
        total,
        student: 0,
        bank,
        staff,
        admin: 0,
        other: 0
      };
    } catch (e) {
      console.error('[getUserStats] Exception:', e);
      return { total: 0, student: 0, bank: 0, staff: 0, admin: 0, other: 0 };
    }
  }

  async updateUserDetails(
    email: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    dateOfBirth: string,
    intakeSeason?: string,
    profileImage?: string,
    pincode?: string,
    targetUniversity?: string,
    studyDestination?: string,
    fatherName?: string,
    motherName?: string,
    family?: any,
    coApplicant?: any,
    academic?: any,
    userId?: string
  ) {
    const dobDate = dateOfBirth ? this.parseDate(dateOfBirth) : null;

    // Lookup user by userId if provided, or case-insensitive email fallback
    let targetUser: any = null;
    if (userId) {
      const { data: u } = await this.db.from('User').select('*').eq('id', userId).maybeSingle();
      targetUser = u;
    }
    if (!targetUser && email) {
      const { data: u } = await this.db.from('User').select('*').ilike('email', email.trim()).maybeSingle();
      targetUser = u;
    }

    if (!targetUser && email && email.trim()) {
      const newId = randomUUID();
      const { data: created, error: createErr } = await this.db
        .from('User')
        .insert({
          id: newId,
          email: email.trim().toLowerCase(),
          firstName: firstName || 'User',
          lastName: lastName || '',
          phoneNumber: phoneNumber || '',
          mobile: phoneNumber || '',
          password: '',
          role: 'user',
        })
        .select()
        .maybeSingle();

      if (!createErr && created) {
        targetUser = created;
      }
    }

    if (!targetUser) {
      console.warn(`[UsersService.updateUserDetails] User not found for email=${email}, userId=${userId}`);
      return { success: false, message: 'User not found' };
    }

    // Prepare update payload for User table
    const updatePayload: any = {};
    if (firstName !== undefined) updatePayload.firstName = firstName;
    if (lastName !== undefined) updatePayload.lastName = lastName;
    if (phoneNumber !== undefined) {
      updatePayload.phoneNumber = phoneNumber;
      updatePayload.mobile = phoneNumber;
    }
    if (dobDate !== null) updatePayload.dateOfBirth = dobDate;
    if (intakeSeason !== undefined) updatePayload.intakeSeason = intakeSeason;
    if (pincode !== undefined) updatePayload.pincode = pincode;
    if (targetUniversity !== undefined) updatePayload.targetUniversity = targetUniversity;
    if (studyDestination !== undefined) updatePayload.studyDestination = studyDestination;
    if (email) updatePayload.email = email;

    // Parse and handle academic object
    let parsedAcademic: any = {};
    if (academic) {
      try {
        parsedAcademic = typeof academic === 'string' ? JSON.parse(academic) : academic;
      } catch {}
    }
    if (parsedAcademic.gpa !== undefined && !isNaN(parseFloat(parsedAcademic.gpa))) {
      updatePayload.gpa = parseFloat(parsedAcademic.gpa);
    }
    if (parsedAcademic.workExp !== undefined && !isNaN(parseInt(parsedAcademic.workExp, 10))) {
      updatePayload.workExp = parseInt(parsedAcademic.workExp, 10);
    }
    if (parsedAcademic.bachelorsDegree) {
      updatePayload.bachelorsDegree = parsedAcademic.bachelorsDegree;
    }
    if (parsedAcademic.targetUniversity && !updatePayload.targetUniversity) {
      updatePayload.targetUniversity = parsedAcademic.targetUniversity;
    }
    if (parsedAcademic.countryOfEducation && !updatePayload.studyDestination) {
      updatePayload.studyDestination = parsedAcademic.countryOfEducation;
    }

    // Build merged family & co-applicant objects for relational sync
    let familyObj: any = {};
    if (targetUser.family) {
      try {
        familyObj = typeof targetUser.family === 'string' ? JSON.parse(targetUser.family) : targetUser.family;
      } catch {}
    }
    if (family) {
      const parsedFam = typeof family === 'string' ? (JSON.parse(family) || {}) : family;
      familyObj = { ...familyObj, ...parsedFam };
    }
    if (fatherName) familyObj.fatherName = fatherName;
    if (motherName) familyObj.motherName = motherName;

    let coAppObj: any = {};
    if (targetUser.coApplicant) {
      try {
        coAppObj = typeof targetUser.coApplicant === 'string' ? JSON.parse(targetUser.coApplicant) : targetUser.coApplicant;
      } catch {}
    }
    if (coApplicant) {
      const parsedCoApp = typeof coApplicant === 'string' ? (JSON.parse(coApplicant) || {}) : coApplicant;
      coAppObj = { ...coAppObj, ...parsedCoApp };
    }

    // Sanitize payload to ONLY include valid columns on User table (avoids PGRST204)
    const safeUserPayload = sanitizeUserPayload(updatePayload);

    let updatedUser = targetUser;
    if (Object.keys(safeUserPayload).length > 0) {
      const { data, error } = await this.db
        .from('User')
        .update(safeUserPayload)
        .eq('id', targetUser.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (data) updatedUser = data;
    }

    // Upsert specialized profiles (UserAcademicProfile, UserStudyPreference, UserFinancialProfile)
    try {
      if (updatedUser && updatedUser.id) {
        const uId = updatedUser.id;

        // 1. UserAcademicProfile
        const academicProf = {
          userId: uId,
          bachelorsDegree: parsedAcademic.bachelorsDegree || updatedUser.bachelorsDegree || null,
          gpa: parsedAcademic.gpa ? parseFloat(parsedAcademic.gpa) : (updatedUser.gpa || null),
          workExp: parsedAcademic.workExp ? parseInt(parsedAcademic.workExp, 10) : (updatedUser.workExp || null),
          entranceTest: parsedAcademic.entranceTest || updatedUser.entranceTest || null,
          entranceScore: parsedAcademic.entranceScore || updatedUser.entranceScore || null,
          englishTest: parsedAcademic.englishTest || updatedUser.englishTest || null,
          englishScore: parsedAcademic.englishScore || updatedUser.englishScore || null,
        };
        const { data: existingAcad } = await this.db.from('UserAcademicProfile').select('id').eq('userId', uId).maybeSingle();
        if (existingAcad) {
          await this.db.from('UserAcademicProfile').update(academicProf).eq('userId', uId);
        } else {
          await this.db.from('UserAcademicProfile').insert(academicProf);
        }

        // 2. UserStudyPreference
        const studyPref = {
          userId: uId,
          goal: updatedUser.goal || null,
          studyDestination: studyDestination || updatedUser.studyDestination || null,
          courseName: updatedUser.courseName || null,
          targetUniversity: targetUniversity || updatedUser.targetUniversity || null,
          intakeSeason: intakeSeason || updatedUser.intakeSeason || null,
          admitStatus: updatedUser.admitStatus || null,
        };
        const { data: existingStudy } = await this.db.from('UserStudyPreference').select('id').eq('userId', uId).maybeSingle();
        if (existingStudy) {
          await this.db.from('UserStudyPreference').update(studyPref).eq('userId', uId);
        } else {
          await this.db.from('UserStudyPreference').insert(studyPref);
        }

        // 3. UserFinancialProfile
        const finProf = {
          userId: uId,
          budget: updatedUser.budget || null,
          pincode: pincode || updatedUser.pincode || null,
          loanAmount: updatedUser.loanAmount || null,
        };
        const { data: existingFin } = await this.db.from('UserFinancialProfile').select('id').eq('userId', uId).maybeSingle();
        if (existingFin) {
          await this.db.from('UserFinancialProfile').update(finProf).eq('userId', uId);
        } else {
          await this.db.from('UserFinancialProfile').insert(finProf);
        }
      }
    } catch (profErr: any) {
      console.warn(`[UsersService.updateUserDetails] Profile sync warning: ${profErr.message}`);
    }

    // Upsert parents table rows for father, mother, coapplicant
    if (updatedUser && updatedUser.id) {
      // 1. Father
      const fName = fatherName || familyObj.fatherName || familyObj.father_name;
      const fAadhar = familyObj.fatherAadhar || familyObj.father_aadhar;
      const fPan = familyObj.fatherPan || familyObj.father_pan;
      if (fName || fAadhar || fPan) {
        await this.upsertParentRecord(updatedUser.id, 'father', {
          name: fName || undefined,
          aadharNumber: fAadhar || undefined,
          panNumber: fPan || undefined
        }).catch(() => {});
      }

      // 2. Mother
      const mName = motherName || familyObj.motherName || familyObj.mother_name;
      const mAadhar = familyObj.motherAadhar || familyObj.mother_aadhar;
      const mPan = familyObj.motherPan || familyObj.mother_pan;
      if (mName || mAadhar || mPan) {
        await this.upsertParentRecord(updatedUser.id, 'mother', {
          name: mName || undefined,
          aadharNumber: mAadhar || undefined,
          panNumber: mPan || undefined
        }).catch(() => {});
      }

      // 3. Co-applicant
      const cName = coAppObj.name || familyObj.coappName || familyObj.coApplicantName || familyObj.coapp_name;
      const cRelation = coAppObj.relation || familyObj.coappRelation || familyObj.coApplicantRelation;
      const cAadhar = coAppObj.aadharNumber || familyObj.coappAadhar || familyObj.coApplicantAadhar;
      const cPan = coAppObj.panNumber || familyObj.coappPan || familyObj.coApplicantPan;
      if (cName || cAadhar || cPan || cRelation) {
        await this.upsertParentRecord(updatedUser.id, 'coapplicant', {
          name: cName || undefined,
          relation: cRelation || undefined,
          aadharNumber: cAadhar || undefined,
          panNumber: cPan || undefined
        }).catch(() => {});
      }
    }

    // Sync to active LoanApplications for this user to keep their application profile details in sync
    try {
      if (updatedUser && updatedUser.id) {
        const appPayload: any = {};
        if (firstName !== undefined) appPayload.firstName = firstName;
        if (lastName !== undefined) appPayload.lastName = lastName;
        if (phoneNumber !== undefined) appPayload.phone = phoneNumber;
        if (dobDate !== null && dobDate !== undefined) appPayload.dateOfBirth = dobDate;
        if (targetUniversity !== undefined) appPayload.universityName = targetUniversity;
        if (studyDestination !== undefined) appPayload.country = studyDestination;
        if (fatherName || familyObj.fatherName) appPayload.fatherName = fatherName || familyObj.fatherName;
        if (motherName || familyObj.motherName) appPayload.motherName = motherName || familyObj.motherName;
        if (coAppObj.name || familyObj.coappName) appPayload.coApplicantName = coAppObj.name || familyObj.coappName;
        if (coAppObj.relation || familyObj.coappRelation) appPayload.coApplicantRelation = coAppObj.relation || familyObj.coappRelation;

        if (Object.keys(appPayload).length > 0) {
          await this.db
            .from('LoanApplication')
            .update(appPayload)
            .eq('userId', updatedUser.id);
        }
      }
    } catch (syncErr: any) {
      console.error(`[UsersService.updateUserDetails] Error syncing details to LoanApplication: ${syncErr.message}`);
    }

    if (email) this.clearCache(email);
    return {
      ...updatedUser,
      family: familyObj,
      coApplicant: coAppObj,
      academic: parsedAcademic,
    };
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

      // Automatically extract and set details for father, mother, coapplicant, brother, sister, spouse, guarantor, and custom document relations
      let relation: string | null = null;
      const normalizedDocType = (docType || '').toLowerCase();

      if (normalizedDocType.startsWith('father_') || normalizedDocType.includes('father')) {
        relation = 'father';
      } else if (normalizedDocType.startsWith('mother_') || normalizedDocType.includes('mother')) {
        relation = 'mother';
      } else if (normalizedDocType.startsWith('brother_') || normalizedDocType.includes('brother')) {
        relation = 'brother';
      } else if (normalizedDocType.startsWith('sister_') || normalizedDocType.includes('sister')) {
        relation = 'sister';
      } else if (normalizedDocType.startsWith('spouse_') || normalizedDocType.includes('spouse')) {
        relation = 'spouse';
      } else if (normalizedDocType.startsWith('guarantor_') || normalizedDocType.includes('guarantor')) {
        relation = 'guarantor';
      } else if (normalizedDocType.startsWith('guardian_') || normalizedDocType.includes('guardian')) {
        relation = 'guardian';
      } else if (
        normalizedDocType.startsWith('coapplicant_') ||
        normalizedDocType.includes('coapplicant') ||
        normalizedDocType.includes('co_applicant')
      ) {
        relation = 'coapplicant';
      } else if (normalizedDocType.includes('_aadhar') || normalizedDocType.includes('_aadhaar') || normalizedDocType.includes('_pan')) {
        const parts = normalizedDocType.split('_');
        if (parts.length >= 2 && parts[0] !== 'student' && parts[0] !== 'other') {
          relation = parts[0];
        }
      }

      if (relation) {
        const extractedName = extractFullNameFromOcrRaw(details, docType) ||
          details.mother_name || details.motherName || details.mother_full_name || details.motherFullName ||
          details.father_name || details.fatherName || details.father_full_name || details.fatherFullName ||
          details.coapplicant_name || details.coApplicantName || details.co_applicant_name ||
          details.full_name || details.fullName || details.name || details.holder_name || details.printed_name;

        const nameToSave = extractedName && typeof extractedName === 'string' && extractedName.trim() ? extractedName.trim() : undefined;

        // Clean Aadhar (12 digits) if present
        let aadharNum: string | undefined = undefined;
        const rawAadhar = details.aadhaar_number || details.aadhar_number || details.aadharNumber || details.aadhaar_no || details.aadhar_no || details.aadhar_num || (normalizedDocType.includes('aadhar') || normalizedDocType.includes('aadhaar') ? details.document_number || details.id_number : undefined);
        if (rawAadhar) {
          const cleanAadhar = String(rawAadhar).replace(/\D/g, '');
          if (cleanAadhar.length === 12) {
            aadharNum = cleanAadhar;
          } else if (String(rawAadhar).trim()) {
            aadharNum = String(rawAadhar).trim();
          }
        }

        // Clean PAN (10 chars uppercase) if present
        let panNum: string | undefined = undefined;
        const rawPan = details.pan_number || details.panNumber || details.pan_no || details.pan || details.pan_num || details.taxpayer_id || (normalizedDocType.includes('pan') && !normalizedDocType.includes('company') ? details.document_number || details.id_number : undefined);
        if (rawPan) {
          const cleanPan = String(rawPan).trim().toUpperCase();
          if (cleanPan.length === 10) {
            panNum = cleanPan;
          } else if (cleanPan) {
            panNum = cleanPan;
          }
        }

        let family = currentUser.family;
        if (typeof family === 'string') {
          try { family = JSON.parse(family); } catch { family = {}; }
        }
        if (!family || typeof family !== 'object') {
          family = {};
        }

        let coApplicant = currentUser.coApplicant;
        if (typeof coApplicant === 'string') {
          try { coApplicant = JSON.parse(coApplicant); } catch { coApplicant = {}; }
        }
        if (!coApplicant || typeof coApplicant !== 'object') {
          coApplicant = {};
        }

        if (!family.relatives || typeof family.relatives !== 'object') {
          family.relatives = {};
        }
        if (!family.relatives[relation] || typeof family.relatives[relation] !== 'object') {
          family.relatives[relation] = {};
        }

        let updated = false;

        if (relation === 'father') {
          if (nameToSave) { family.fatherName = nameToSave; updated = true; }
          if (aadharNum) { family.fatherAadhar = aadharNum; updated = true; }
          if (panNum) { family.fatherPan = panNum; updated = true; }
        } else if (relation === 'mother') {
          if (nameToSave) { family.motherName = nameToSave; updated = true; }
          if (aadharNum) { family.motherAadhar = aadharNum; updated = true; }
          if (panNum) { family.motherPan = panNum; updated = true; }
        } else if (relation === 'coapplicant') {
          if (nameToSave) { coApplicant.name = nameToSave; updated = true; }
          if (aadharNum) { coApplicant.aadhar = aadharNum; updated = true; }
          if (panNum) { coApplicant.pan = panNum; updated = true; }
        }

        if (nameToSave) { family.relatives[relation].name = nameToSave; updated = true; }
        if (aadharNum) { family.relatives[relation].aadharNumber = aadharNum; updated = true; }
        if (panNum) { family.relatives[relation].panNumber = panNum; updated = true; }

        if (updated) {
          payload.family = typeof currentUser.family === 'object' && currentUser.family !== null ? family : JSON.stringify(family);
          if (relation === 'coapplicant') {
            payload.coApplicant = typeof currentUser.coApplicant === 'object' && currentUser.coApplicant !== null ? coApplicant : JSON.stringify(coApplicant);
          }
        }

        const parentName = nameToSave || (relation === 'mother' ? family.motherName : relation === 'father' ? family.fatherName : relation === 'coapplicant' ? coApplicant.name : family.relatives[relation]?.name);
        const parentAadhar = aadharNum || (relation === 'mother' ? family.motherAadhar : relation === 'father' ? family.fatherAadhar : relation === 'coapplicant' ? coApplicant.aadhar : family.relatives[relation]?.aadharNumber);
        const parentPan = panNum || (relation === 'mother' ? family.motherPan : relation === 'father' ? family.fatherPan : relation === 'coapplicant' ? coApplicant.pan : family.relatives[relation]?.panNumber);

        await this.upsertParentRecord(userId, relation, {
          name: parentName,
          aadharNumber: parentAadhar,
          panNumber: parentPan,
        }).catch(err => {
          console.error(`[UsersService.updateExtractedDetails] Failed to upsert parent record for ${relation}:`, err.message);
        });

        if (nameToSave) {
          console.log(`[UsersService.updateExtractedDetails] Automatically updated name for ${docType}: ${nameToSave}`);
          try {
            const appUpdatePayload: any = {};
            if (relation === 'father') appUpdatePayload.fatherName = nameToSave;
            else if (relation === 'mother') appUpdatePayload.motherName = nameToSave;
            else if (relation === 'coapplicant') appUpdatePayload.coApplicantName = nameToSave;

            if (Object.keys(appUpdatePayload).length > 0) {
              await this.db
                .from('LoanApplication')
                .update(appUpdatePayload)
                .eq('userId', userId);
            }
          } catch (syncErr: any) {
            console.error(`[UsersService.updateExtractedDetails] Error syncing name to LoanApplication: ${syncErr.message}`);
          }
        }
      }

      // Automatically sync gender if present on student's uploaded documents (like Passport)
      if (!relation) {
        const rawGender = details.gender || details.sex;
        if (rawGender) {
          const g = String(rawGender).toLowerCase().trim();
          const genderVal = g.startsWith('m') ? 'Male' : g.startsWith('f') ? 'Female' : rawGender;

          try {
            await this.db
              .from('LoanApplication')
              .update({ gender: genderVal })
              .eq('userId', userId)
              .neq('status', 'cancelled');
            console.log(`[UsersService.updateExtractedDetails] Automatically updated student gender to ${genderVal} on LoanApplication for user: ${userId}`);
          } catch (syncErr: any) {
            console.error(`[UsersService.updateExtractedDetails] Error syncing student gender to LoanApplication: ${syncErr.message}`);
          }
        }
      }

      // We no longer automatically fill firstName, lastName, dob, phone, aadhaar, pan, etc.,
      // directly on document upload. The Staff Dashboard manually handles autofill
      // by sending a PUT request after reviewing the OCR data.

      // Automatically update academic profile (10th, 12th, UG/Graduation) on document upload
      if (
        normalizedDocType.includes('marksheet') ||
        normalizedDocType.includes('ug') ||
        normalizedDocType.includes('degree') ||
        normalizedDocType.includes('graduation') ||
        normalizedDocType.includes('bachelor') ||
        normalizedDocType.includes('undergrad') ||
        normalizedDocType.includes('ssc') ||
        normalizedDocType.includes('hsc') ||
        normalizedDocType.includes('10th') ||
        normalizedDocType.includes('12th') ||
        normalizedDocType.includes('inter') ||
        normalizedDocType.includes('grade')
      ) {
        const inst = details.institution || details.university || details.college_name || details.institution_name || details.university_name || details.board || details.board_name || details.school_name || details.school || details.college || details.awarding_body;
        const rawScore = details.percentage || details.score || details.gpa || details.cgpa || details.overall_percentage || details.marks_percentage || details.aggregate_percentage || details.overall_gpa || details.overall_cgpa;
        const secured = details.total_marks_secured || details.marks_secured || details.marks_obtained || details.obtained_marks || details.secured_marks || details.total_marks;
        const max = details.total_marks_maximum || details.maximum_marks || details.max_marks || details.total_max || details.out_of;

        let computedPercentage: string | undefined = undefined;
        if (rawScore != null && rawScore !== '') {
          const numScore = parseFloat(String(rawScore).replace(/[^\d.]/g, ''));
          if (!isNaN(numScore)) {
            if (numScore <= 10 && numScore > 0) {
              computedPercentage = String(Math.round(numScore * 9.5 * 10) / 10);
            } else if (numScore <= 100) {
              computedPercentage = String(Math.round(numScore * 10) / 10);
            }
          }
        }
        if (!computedPercentage && secured != null && max != null) {
          const secNum = parseFloat(String(secured).replace(/[^\d.]/g, ''));
          const maxNum = parseFloat(String(max).replace(/[^\d.]/g, ''));
          if (!isNaN(secNum) && !isNaN(maxNum) && maxNum > 0) {
            computedPercentage = String(Math.round((secNum / maxNum) * 100 * 10) / 10);
          }
        }

        const score = computedPercentage || (rawScore ? String(rawScore) : undefined);

        let academic = currentUser.academic;
        if (typeof academic === 'string') {
          try { academic = JSON.parse(academic); } catch { academic = {}; }
        }
        if (!academic || typeof academic !== 'object') academic = {};

        let academicUpdated = false;

        if (
          normalizedDocType.includes('ug') ||
          normalizedDocType.includes('degree') ||
          normalizedDocType.includes('graduation') ||
          normalizedDocType.includes('bachelor') ||
          normalizedDocType.includes('undergrad')
        ) {
          if (!academic.ug) academic.ug = {};
          if (inst) { academic.ug.institute = inst; academicUpdated = true; payload.bachelorsDegree = inst; }
          if (score) { academic.ug.percentage = String(score); academicUpdated = true; }
        } else if (normalizedDocType.includes('10th') || normalizedDocType.includes('ssc') || normalizedDocType.includes('marksheet_10') || normalizedDocType.includes('grade_10') || normalizedDocType.includes('grade10')) {
          if (!academic.ssc) academic.ssc = {};
          if (inst) { academic.ssc.institute = inst; academicUpdated = true; }
          if (score) { academic.ssc.percentage = String(score); academicUpdated = true; }
        } else if (normalizedDocType.includes('12th') || normalizedDocType.includes('hsc') || normalizedDocType.includes('marksheet_12') || normalizedDocType.includes('intermediate') || normalizedDocType.includes('inter') || normalizedDocType.includes('grade_12') || normalizedDocType.includes('grade12')) {
          if (!academic.hsc) academic.hsc = {};
          if (inst) { academic.hsc.institute = inst; academicUpdated = true; }
          if (score) { academic.hsc.percentage = String(score); academicUpdated = true; }
        }

        if (academicUpdated) {
          payload.academic = typeof currentUser.academic === 'string' ? JSON.stringify(academic) : academic;
        }
      }

      if (Object.keys(payload).length === 0) {
        console.log('[UsersService.updateExtractedDetails] No fields to update.');
        return { success: true };
      }

      const safePayload = sanitizeUserPayload(payload);

      let data: any = null;
      if (Object.keys(safePayload).length > 0) {
        const { data: updatedData, error } = await this.db
          .from('User')
          .update(safePayload)
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          console.warn(`[UsersService.updateExtractedDetails] Warning updating User table: ${error.message}`);
        } else {
          data = updatedData;
        }
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
    let updatedUser = data;

    if (role === 'staff' || role === 'admin' || role === 'super_admin') {
      try {
        const u = updatedUser || (await this.findOne(email));
        if (u && u.id) {
          const { data: existingProfile } = await this.db
            .from('StaffProfile')
            .select('id')
            .eq('linkedUserId', u.id)
            .maybeSingle();

          if (!existingProfile) {
            await this.db.from('StaffProfile').insert({
              linkedUserId: u.id,
              email: u.email,
              assignedStaffId: u.id,
              bankStatus: 'NOT_SENT',
              updatedAt: new Date().toISOString(),
            });
            console.log(`[UsersService.updateUserRole] Created StaffProfile for ${email}`);
          }
        }
      } catch (profileErr: any) {
        console.error(`[UsersService.updateUserRole] StaffProfile creation error: ${profileErr.message}`);
      }
    }

    this.clearCache(email);
    return updatedUser;
  }

  private async validateApplicationConstraints(userId: string, bank: string | null | undefined, country: string | null | undefined, universityName: string | null | undefined) {
    const { data: existingApps, error } = await this.db
      .from('LoanApplication')
      .select('id, bank, country, universityName, status')
      .eq('userId', userId)
      .neq('status', 'cancelled')
      .neq('status', 'rejected');

    if (error) throw error;

    // Limit to 1 active application per student
    if (existingApps && existingApps.length >= 1) {
      throw new BadRequestException('Only 1 active loan application is permitted per student. You already have an application in progress.');
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
      coApplicantName?: string;
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
      pincode?: string;
      city?: string;
      state?: string;
      admissionStatus?: string;
    },
  ) {
    const universityName = data.universityName || data.targetUniversity || data.university || null;
    const country = data.country || null;
    const bank = data.bank || null;

    await this.validateApplicationConstraints(userId, bank, country, universityName);

    const now = new Date().toISOString();

    // Note: applicationNumber is NOT generated here — it is assigned only when the application is submitted to the bank.

    // Calculate estimated completion (14 days from now)
    const estimatedCompletionAt = new Date();
    estimatedCompletionAt.setDate(estimatedCompletionAt.getDate() + 14);

    const courseName = data.courseName || data.programFocus || data.program || data.courseType || null;

    const insertPayload: any = {
      id: randomUUID(),
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
      pincode: data.pincode || null,
      city: data.city || null,
      state: data.state || null,
      hasCoApplicant: !!data.coApplicant && data.coApplicant !== 'none',
      coApplicantName: data.coApplicantName || null,
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
    };

    const { data: application, error } = await this.db
      .from('LoanApplication')
      .insert(insertPayload)
      .select('*, user:User!userId(id, email, firstName, lastName, tests)')
      .single();

    if (error) throw error;

    // Log complete application lead details to separate ApplyLoan table
    try {
      console.log(`[UsersService] Logging details to separate ApplyLoan table for application id=${insertPayload.id}`);
      await this.db
        .from('ApplyLoan')
        .insert({
          userId,
          bank: data.bank || null,
          loanType: data.loanType || null,
          amount: data.amount || null,
          courseType: data.courseType || null,
          country: data.country || null,
          university: data.university || null,
          annualFee: data.annualFee ? parseFloat(String(data.annualFee).replace(/,/g, '')) : null,
          livingCost: data.livingCost ? parseFloat(String(data.livingCost).replace(/,/g, '')) : null,
          coApplicant: data.coApplicant || null,
          income: data.income ? parseFloat(String(data.income).replace(/,/g, '')) : null,
          collateral: data.collateral || null,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          email: data.email || null,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth || null,
          address: data.address || null,
          pincode: data.pincode || null,
          notes: data.notes || null,
          admissionStatus: data.admissionStatus || null,
          intakeSeason: data.intakeSeason || null,
          createdAt: now,
          updatedAt: now,
        });
    } catch (dbErr) {
      console.error('Failed to log to separate ApplyLoan table:', dbErr);
    }

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
      const appNumLabel = (application.applicationNumber && (application.applicationNumber.startsWith('VTU-APP-') || application.applicationNumber.startsWith('VTU-BNK-') || application.applicationNumber.startsWith('VL-APP-')))
        ? ` #${application.applicationNumber}`
        : '';
      this.eventEmitter.emit('dashboard.activity', {
        type: 'application',
        msg: `Student ${name} submitted a new Loan Application${appNumLabel} for ${targetUni}.`,
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

  async getApplyLoanApplications() {
    const res = await this.db
      .from('ApplyLoan')
      .select('*')
      .order('createdAt', { ascending: false });

    if (res.error) {
      console.warn('[UsersService.getApplyLoanApplications] ApplyLoan table error, falling back to LoanApplication:', res.error.message);
      const fallbackRes = await this.db
        .from('LoanApplication')
        .select('*')
        .order('date', { ascending: false });

      return fallbackRes;
    }

    return res;
  }

  async getUserApplications(userIdOrEmail: string) {
    if (!userIdOrEmail) return [];

    let user: any = null;
    if (userIdOrEmail.includes('@')) {
      user = await this.findOne(userIdOrEmail);
    } else {
      user = await this.findById(userIdOrEmail);
    }

    const targetUserId = user?.id || (userIdOrEmail.includes('@') ? null : userIdOrEmail);
    const targetEmail = user?.email || (userIdOrEmail.includes('@') ? userIdOrEmail : null);

    const runQuery = async (withRelation: boolean) => {
      let query: any = this.db.from('LoanApplication');
      if (withRelation) {
        query = query.select('*, user:User!userId(id, intakeSeason, firstName, lastName, phoneNumber, coApplicantName, coApplicantPhone, coApplicantEmail, coApplicantRelation, coApplicantIncome, familyDetails, parents)');
      } else {
        query = query.select('*');
      }

      if (targetUserId && targetEmail) {
        query = query.or(`userId.eq.${targetUserId},email.eq.${targetEmail}`);
      } else if (targetEmail) {
        query = query.eq('email', targetEmail);
      } else if (targetUserId) {
        query = query.eq('userId', targetUserId);
      }

      return await query.order('submittedAt', { ascending: false, nullsFirst: false });
    };

    let { data, error } = await runQuery(true);
    if (error) {
      console.warn('[UsersService.getUserApplications] Relation query warning, falling back to simple select:', error.message);
      const fallback = await runQuery(false);
      data = fallback.data;
      if (fallback.error) {
        console.error('[UsersService.getUserApplications] Simple select error:', fallback.error.message);
      }
    }

    let resultList = data || [];

    // Populate dynamic assigned staff details for each application
    if (resultList.length > 0) {
      try {
        const rawStaffIds = resultList.map((app: any) => app.assignedStaffId).filter(Boolean);
        const uniqueStaffIds = Array.from(new Set(rawStaffIds));

        if (uniqueStaffIds.length > 0) {
          const staffMap: Record<string, any> = {};

          // 1. Fetch from User table
          const orConds = uniqueStaffIds.map((id: string) => id.includes('@') ? `email.eq.${id}` : `id.eq.${id}`).join(',');
          const { data: staffUsers } = await this.db
            .from('User')
            .select('id, firstName, lastName, email, phone, mobile, phoneNumber, role, designation')
            .or(orConds);

          (staffUsers || []).forEach((u: any) => {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Support Staff';
            const staffObj = {
              id: u.id,
              name: fullName,
              email: u.email || '',
              phone: u.phoneNumber || u.phone || u.mobile || '',
              role: u.designation || (u.role === 'admin' || u.role === 'super_admin' ? 'Senior Loan Officer & Admin' : 'Senior Education Loan Advisor'),
            };
            if (u.id) staffMap[u.id.toLowerCase()] = staffObj;
            if (u.email) staffMap[u.email.toLowerCase()] = staffObj;
          });

          // 2. Fetch from StaffProfile table for extra profile info
          const { data: staffProfiles } = await this.db
            .from('StaffProfile')
            .select('*');

          (staffProfiles || []).forEach((sp: any) => {
            const fullName = sp.fullName || sp.name || 'Support Officer';
            const staffObj = {
              id: sp.linkedUserId || sp.staffId || sp.id,
              name: fullName,
              email: sp.email || '',
              phone: sp.phoneNumber || sp.phone || sp.mobile || '',
              role: sp.role || sp.designation || sp.department || 'Education Loan Processing Specialist',
            };
            if (sp.id) staffMap[sp.id.toLowerCase()] = staffObj;
            if (sp.staffId) staffMap[sp.staffId.toLowerCase()] = staffObj;
            if (sp.linkedUserId) staffMap[sp.linkedUserId.toLowerCase()] = staffObj;
            if (sp.email) staffMap[sp.email.toLowerCase()] = staffObj;
          });

          // Attach to applications
          resultList = resultList.map((app: any) => {
            if (app.assignedStaffId) {
              const key = String(app.assignedStaffId).toLowerCase();
              const staff = staffMap[key];
              if (staff) {
                return {
                  ...app,
                  assignedStaffName: staff.name,
                  assignedStaffEmail: staff.email,
                  assignedStaffPhone: staff.phone,
                  assignedStaffRole: staff.role,
                  assignedStaff: staff,
                };
              }
            }
            return app;
          });
        }
      } catch (err: any) {
        console.warn('[UsersService.getUserApplications] Staff details enrichment warning:', err?.message);
      }
    }

    return resultList;
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
    if (data.uploaded) {
      payload.rejectionReason = null;
      if (mergedMetadata) {
        delete (mergedMetadata as any).rejectionReason;
        if ((mergedMetadata as any).details) {
          delete (mergedMetadata as any).details.rejectionReason;
        }
      } else if (existingMetadata) {
        const cleanMetadata = { ...existingMetadata };
        delete (cleanMetadata as any).rejectionReason;
        if ((cleanMetadata as any).details) {
          delete (cleanMetadata as any).details.rejectionReason;
        }
        payload.verificationMetadata = cleanMetadata;
      }
    }
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
    const { data: currentDoc } = await this.db
      .from('UserDocument')
      .select('*')
      .eq('id', docId)
      .maybeSingle();

    const existingMeta = currentDoc?.verificationMetadata || {};

    const payload: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'verified') {
      payload.verifiedAt = new Date().toISOString();
      payload.rejectionReason = null;
      payload.verificationMetadata = {
        ...(typeof existingMeta === 'object' ? existingMeta : {}),
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        message: 'Document manually verified by staff',
      };
    }

    if (status === 'rejected') {
      payload.verifiedAt = null;
      payload.rejectionReason = rejectionReason || null;
      payload.verificationMetadata = {
        ...(typeof existingMeta === 'object' ? existingMeta : {}),
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason || null,
        message: rejectionReason ? `Document rejected by staff: ${rejectionReason}` : 'Document rejected by staff',
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

    if (status === 'verified' && data) {
      try {
        const details = existingMeta.details || {};
        const extractedFields = details.extractedFields || existingMeta.extractedFields || {};

        if (extractedFields && Object.keys(extractedFields).length > 0) {
          console.log(`[UsersService.updateDocumentStatus] Auto-updating details for user ${data.userId} from verified docType ${data.docType}`);
          await this.updateExtractedDetails(data.userId, {
            documentVerified: true,
            ...extractedFields
          }, data.docType);
        }
      } catch (err: any) {
        console.error(`[UsersService.updateDocumentStatus] Error in auto-updating extracted details:`, err.message);
      }
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

      const { data: userWithActivity, error: userErr } = await this.db
        .from('User')
        .select(
          `*, eligibilityChecks:LoanEligibilityCheck(*), visaMockInterviews:VisaMockInterviewResult(*), forumPosts:ForumPost(*), forumComments:ForumComment(*)`,
        )
        .eq('id', userId)
        .single();

      if (userErr) {
        console.error('[UsersService.getUserDashboardData] User fetch error:', userErr);
      }

      const { data: parentsData, error: parentsErr } = await this.db
        .from('parents')
        .select('*')
        .eq('userId', userId);

      if (parentsErr) {
        console.error('[UsersService.getUserDashboardData] parents fetch error:', parentsErr);
      }

      const { data: inquiriesData } = await this.db
        .from('UniversityInquiry')
        .select('*')
        .eq('userId', userId);

      const inquiries = inquiriesData || [];

      const activity: Array<{
        type: string;
        title: string;
        description: string;
        timestamp: string;
        link?: string;
      }> = [];

      for (const app of applications) {
        const ts = app.submittedAt || app.date;
        const bankName = app.bank && app.bank !== 'Any Bank' && app.bank !== 'ANY BANK' && app.bank !== 'Pending Partner' && app.bank !== '—'
          ? app.bank
          : '';
        activity.push({
          type: 'application',
          title: bankName ? `Loan Application — ${bankName}` : `Loan Application`,
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

      let familyObj = userWithActivity?.family;
      if (typeof familyObj === 'string') {
        try { familyObj = JSON.parse(familyObj); } catch { familyObj = {}; }
      }
      if (!familyObj || typeof familyObj !== 'object') familyObj = {};

      let coappObj = userWithActivity?.coApplicant;
      if (typeof coappObj === 'string') {
        try { coappObj = JSON.parse(coappObj); } catch { coappObj = {}; }
      }
      if (!coappObj || typeof coappObj !== 'object') coappObj = {};

      const parentsList = parentsData || [];
      const fatherRec = parentsList.find((p: any) => p.relation === 'father');
      const motherRec = parentsList.find((p: any) => p.relation === 'mother');
      const coappRec = parentsList.find((p: any) => p.relation === 'coapplicant');

      if (fatherRec) {
        if (fatherRec.name) familyObj.fatherName = fatherRec.name;
        if (fatherRec.aadharNumber) familyObj.fatherAadhar = fatherRec.aadharNumber;
        if (fatherRec.panNumber) familyObj.fatherPan = fatherRec.panNumber;
      }

      if (motherRec) {
        if (motherRec.name) familyObj.motherName = motherRec.name;
        if (motherRec.aadharNumber) familyObj.motherAadhar = motherRec.aadharNumber;
        if (motherRec.panNumber) familyObj.motherPan = motherRec.panNumber;
      }

      const getDocFieldServer = (types: string[], fields: string[]) => {
        for (const t of types) {
          const d = (documents || []).find((doc: any) => {
            const type = (doc.docType || '').toLowerCase();
            const target = t.toLowerCase();
            return type === target || type.includes(target) || target.includes(type);
          });
          if (d) {
            let meta = d.verificationMetadata;
            if (typeof meta === 'string') {
              try { meta = JSON.parse(meta); } catch { meta = {}; }
            }
            if (!meta || typeof meta !== 'object') meta = {};
            const details = meta.details || meta.ocrResult || meta.ocr_result || d.ocrResult || d.ocr_result || {};
            const ext = details.extractedFields || details.extracted_fields || meta.extractedFields || meta.extracted_fields || details.extracted_data || meta.extracted_data || {};

            for (const f of fields) {
              if (ext[f] && String(ext[f]).trim()) return String(ext[f]).trim();
              if (details[f] && String(details[f]).trim()) return String(details[f]).trim();
              if (meta[f] && String(meta[f]).trim()) return String(meta[f]).trim();
              if (d[f] && String(d[f]).trim()) return String(d[f]).trim();
            }
          }
        }
        return undefined;
      };

      const docMotherName = getDocFieldServer(['mother_aadhar', 'mother_aadhaar', 'mother_pan', 'coapplicant_aadhar', 'coapplicant_pan'], ['mother_name', 'motherName', 'mother_full_name', 'motherFullName', 'full_name', 'fullName', 'name', 'holder_name', 'printed_name', 'applicant_name']);
      const docMotherAadhar = getDocFieldServer(['mother_aadhar', 'mother_aadhaar', 'coapplicant_aadhar', 'coapplicant_aadhaar'], ['aadhaarNumber', 'aadharNumber', 'document_number', 'aadhaar_number', 'aadhar_number', 'id_number', 'uid', 'aadhaar_no', 'aadhar_no']);
      const docMotherPan = getDocFieldServer(['mother_pan', 'coapplicant_pan'], ['panNumber', 'document_number', 'pan_number', 'pan', 'pan_no', 'id_number', 'taxpayer_id']);

      const docFatherName = getDocFieldServer(['father_aadhar', 'father_aadhaar', 'father_pan', 'coapplicant_aadhar', 'coapplicant_pan'], ['father_name', 'fatherName', 'father_full_name', 'fatherFullName', 'full_name', 'fullName', 'name', 'holder_name', 'printed_name', 'applicant_name']);
      const docFatherAadhar = getDocFieldServer(['father_aadhar', 'father_aadhaar', 'coapplicant_aadhar', 'coapplicant_aadhaar'], ['aadhaarNumber', 'aadharNumber', 'document_number', 'aadhaar_number', 'aadhar_number', 'id_number', 'uid', 'aadhaar_no', 'aadhar_no']);
      const docFatherPan = getDocFieldServer(['father_pan', 'coapplicant_pan'], ['panNumber', 'document_number', 'pan_number', 'pan', 'pan_no', 'id_number', 'taxpayer_id']);

      const isPlaceholderName = (nameVal?: string) => !nameVal || nameVal.trim().toLowerCase() === 'mother' || nameVal.trim().toLowerCase() === 'father';

      if (isPlaceholderName(familyObj.motherName) && docMotherName) familyObj.motherName = docMotherName;
      if (!familyObj.motherAadhar && docMotherAadhar) familyObj.motherAadhar = docMotherAadhar;
      if (!familyObj.motherPan && docMotherPan) familyObj.motherPan = docMotherPan;

      if (isPlaceholderName(familyObj.fatherName) && docFatherName) familyObj.fatherName = docFatherName;
      if (!familyObj.fatherAadhar && docFatherAadhar) familyObj.fatherAadhar = docFatherAadhar;
      if (!familyObj.fatherPan && docFatherPan) familyObj.fatherPan = docFatherPan;

      // Auto-upsert into parents table if details exist
      const finalMotherName = (!isPlaceholderName(familyObj.motherName) ? familyObj.motherName : undefined) || (!isPlaceholderName(motherRec?.name) ? motherRec?.name : undefined) || docMotherName;
      const finalMotherAadhar = familyObj.motherAadhar || motherRec?.aadharNumber || docMotherAadhar;
      const finalMotherPan = familyObj.motherPan || motherRec?.panNumber || docMotherPan;
      if (finalMotherName || finalMotherAadhar || finalMotherPan) {
        this.upsertParentRecord(userId, 'mother', {
          name: finalMotherName,
          aadharNumber: finalMotherAadhar,
          panNumber: finalMotherPan,
        }).catch(() => {});
      }

      const finalFatherName = (!isPlaceholderName(familyObj.fatherName) ? familyObj.fatherName : undefined) || (!isPlaceholderName(fatherRec?.name) ? fatherRec?.name : undefined) || docFatherName;
      const finalFatherAadhar = familyObj.fatherAadhar || fatherRec?.aadharNumber || docFatherAadhar;
      const finalFatherPan = familyObj.fatherPan || fatherRec?.panNumber || docFatherPan;
      if (finalFatherName || finalFatherAadhar || finalFatherPan) {
        this.upsertParentRecord(userId, 'father', {
          name: finalFatherName,
          aadharNumber: finalFatherAadhar,
          panNumber: finalFatherPan,
        }).catch(() => {});
      }

      // Sync coapplicant details if coapplicant is Father or Mother
      const coappRelation = String(coappObj.relation || userWithActivity?.coApplicantRelation || '').toLowerCase().trim();
      if (coappRelation === 'father') {
        if (!coappObj.name && finalFatherName) coappObj.name = finalFatherName;
        if (!coappObj.aadhar && finalFatherAadhar) coappObj.aadhar = finalFatherAadhar;
        if (!coappObj.pan && finalFatherPan) coappObj.pan = finalFatherPan;
        if (finalFatherName || finalFatherAadhar || finalFatherPan) {
          this.upsertParentRecord(userId, 'coapplicant', {
            name: finalFatherName,
            aadharNumber: finalFatherAadhar,
            panNumber: finalFatherPan,
            relation: 'father',
          }).catch(() => {});
        }
      } else if (coappRelation === 'mother') {
        if (!coappObj.name && finalMotherName) coappObj.name = finalMotherName;
        if (!coappObj.aadhar && finalMotherAadhar) coappObj.aadhar = finalMotherAadhar;
        if (!coappObj.pan && finalMotherPan) coappObj.pan = finalMotherPan;
        if (finalMotherName || finalMotherAadhar || finalMotherPan) {
          this.upsertParentRecord(userId, 'coapplicant', {
            name: finalMotherName,
            aadharNumber: finalMotherAadhar,
            panNumber: finalMotherPan,
            relation: 'mother',
          }).catch(() => {});
        }
      }

      // Build dynamic parents & relatives map for all document types (father, mother, brother, sister, spouse, coapplicant, guarantor, etc.)
      const parentsMap: Record<string, { relation: string; name: string | null; aadharNumber: string | null; panNumber: string | null }> = {};

      for (const p of parentsList) {
        if (p?.relation) {
          parentsMap[p.relation] = {
            relation: p.relation,
            name: p.name || null,
            aadharNumber: p.aadharNumber || null,
            panNumber: p.panNumber || null,
          };
        }
      }

      parentsMap['father'] = {
        relation: 'father',
        name: finalFatherName || fatherRec?.name || null,
        aadharNumber: finalFatherAadhar || fatherRec?.aadharNumber || null,
        panNumber: finalFatherPan || fatherRec?.panNumber || null,
      };

      parentsMap['mother'] = {
        relation: 'mother',
        name: finalMotherName || motherRec?.name || null,
        aadharNumber: finalMotherAadhar || motherRec?.aadharNumber || null,
        panNumber: finalMotherPan || motherRec?.panNumber || null,
      };

      // Dynamically scan user documents for ANY relation (brother, sister, spouse, coapplicant, guarantor, etc.)
      for (const doc of (documents || [])) {
        const dt = (doc.docType || '').toLowerCase();
        if (dt.includes('_aadhar') || dt.includes('_aadhaar') || dt.includes('_pan')) {
          const parts = dt.split('_');
          const rel = parts[0];
          if (rel && rel !== 'student' && rel !== 'other') {
            if (!parentsMap[rel]) {
              parentsMap[rel] = { relation: rel, name: null, aadharNumber: null, panNumber: null };
            }
            const name = getDocFieldServer([`${rel}_aadhar`, `${rel}_aadhaar`, `${rel}_pan`], ['full_name', 'fullName', 'name', 'holder_name', 'printed_name', 'applicant_name']);
            const aadhar = getDocFieldServer([`${rel}_aadhar`, `${rel}_aadhaar`], ['aadhaarNumber', 'aadharNumber', 'document_number', 'aadhaar_number', 'aadhar_number', 'uid', 'id_number']);
            const pan = getDocFieldServer([`${rel}_pan`], ['panNumber', 'document_number', 'pan_number', 'pan', 'id_number', 'taxpayer_id']);

            if (!parentsMap[rel].name && name) parentsMap[rel].name = name;
            if (!parentsMap[rel].aadharNumber && aadhar) parentsMap[rel].aadharNumber = aadhar;
            if (!parentsMap[rel].panNumber && pan) parentsMap[rel].panNumber = pan;

            // Also ensure parent record exists in DB for this relation
            if (parentsMap[rel].name || parentsMap[rel].aadharNumber || parentsMap[rel].panNumber) {
              this.upsertParentRecord(userId, rel, {
                name: parentsMap[rel].name || undefined,
                aadharNumber: parentsMap[rel].aadharNumber || undefined,
                panNumber: parentsMap[rel].panNumber || undefined,
              }).catch(() => {});
            }
          }
        }
      }

      const updatedParentsList = Object.values(parentsMap);

      const sanitizedUser = userWithActivity ? {
        ...userWithActivity,
        family: familyObj,
        coApplicant: coappObj,
        motherName: finalMotherName,
        motherAadhar: finalMotherAadhar,
        motherPan: finalMotherPan,
        fatherName: finalFatherName,
        fatherAadhar: finalFatherAadhar,
        fatherPan: finalFatherPan,
        parents: updatedParentsList,
      } : null;

      if (sanitizedUser) {
        const firstApp = applications[0] || {};
        if (!sanitizedUser.targetUniversity) {
          sanitizedUser.targetUniversity = firstApp.universityName || firstApp.targetUniversity || firstApp.university || null;
        }
        if (!sanitizedUser.studyDestination) {
          sanitizedUser.studyDestination = firstApp.country || firstApp.destinationCountry || null;
        }
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

  async upsertParentRecord(userId: string, relation: string, data: { name?: string; aadharNumber?: string; panNumber?: string; relation?: string }) {
    // First try to find an existing record
    const { data: existing } = await this.db
      .from('parents')
      .select('*')
      .eq('userId', userId)
      .eq('relation', relation)
      .maybeSingle();

    const payload: any = {
      userId,
      relation,
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      // Merge: only overwrite if new value is provided
      payload.name = data.name ?? existing.name;
      payload.aadharNumber = data.aadharNumber ?? existing.aadharNumber;
      payload.panNumber = data.panNumber ?? existing.panNumber;
      const { data: updated, error } = await this.db
        .from('parents')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    } else {
      // Insert with a proper UUID
      payload.id = randomUUID();
      if (data.name !== undefined) payload.name = data.name;
      if (data.aadharNumber !== undefined) payload.aadharNumber = data.aadharNumber;
      if (data.panNumber !== undefined) payload.panNumber = data.panNumber;
      payload.createdAt = new Date().toISOString();
      const { data: inserted, error } = await this.db
        .from('parents')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return inserted;
    }
  }
}


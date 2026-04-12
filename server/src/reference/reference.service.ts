import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReferenceService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

  // ==================== LOAN TYPES ====================

  async getAllLoanTypes() {
    const { data } = await this.db
      .from('LoanType')
      .select('*')
      .order('isPopular', { ascending: false })
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  async getPopularLoanTypes() {
    const { data } = await this.db
      .from('LoanType')
      .select('*')
      .eq('isPopular', true)
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  async getLoanTypeById(id: string) {
    const { data } = await this.db.from('LoanType').select('*').eq('id', id).single();
    return { success: true, data };
  }

  // ==================== UNIVERSITIES ====================

  async getAllUniversities(filters: any) {
    const { country, ranking, limit = 20, offset = 0 } = filters;

    let query = this.db
      .from('University')
      .select('*', { count: 'exact' })
      .order('isFeatured', { ascending: false })
      .order('ranking', { ascending: true })
      .range(offset, offset + limit - 1);

    if (country) query = query.ilike('country', `%${country}%`);
    if (ranking) query = query.lte('ranking', parseInt(ranking));

    const { data, count } = await query;
    return {
      success: true,
      data: data || [],
      pagination: { total: count || 0, limit, offset, hasMore: offset + (data?.length || 0) < (count || 0) },
    };
  }

  async getFeaturedUniversities(limit: number) {
    const { data } = await this.db
      .from('University')
      .select('*')
      .eq('isFeatured', true)
      .order('ranking', { ascending: true })
      .limit(limit);
    return { success: true, data: data || [] };
  }

  async getUniversityById(id: string) {
    const { data } = await this.db.from('University').select('*').eq('id', id).single();
    return { success: true, data };
  }

  async getUniversitiesByCountry(country: string) {
    const { data } = await this.db
      .from('University')
      .select('*')
      .ilike('country', country)
      .order('ranking', { ascending: true });
    return { success: true, data: data || [] };
  }

  // ==================== BANKS ====================

  async getAllBanks() {
    const { data } = await this.db
      .from('Bank')
      .select('*')
      .order('isPopular', { ascending: false })
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  async getPopularBanks() {
    const { data } = await this.db
      .from('Bank')
      .select('*')
      .eq('isPopular', true)
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  async getBankById(id: string) {
    const { data } = await this.db.from('Bank').select('*').eq('id', id).single();
    return { success: true, data };
  }

  async getBanksByType(type: string) {
    const { data } = await this.db
      .from('Bank')
      .select('*')
      .eq('type', type)
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  // ==================== COUNTRIES ====================

  async getAllCountries() {
    const { data } = await this.db
      .from('Country')
      .select('*')
      .order('popularForStudy', { ascending: false })
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  async getPopularCountries() {
    const { data } = await this.db
      .from('Country')
      .select('*')
      .eq('popularForStudy', true)
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  async getCountryById(id: string) {
    const { data } = await this.db.from('Country').select('*').eq('id', id).single();
    return { success: true, data };
  }

  async getCountryByCode(code: string) {
    const { data } = await this.db
      .from('Country')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    return { success: true, data };
  }

  async getCountriesByRegion(region: string) {
    const { data } = await this.db
      .from('Country')
      .select('*')
      .ilike('region', `%${region}%`)
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  // ==================== SCHOLARSHIPS ====================

  async getAllScholarships(filters: any) {
    const { country, type, limit = 20, offset = 0 } = filters;

    let query = this.db
      .from('Scholarship')
      .select('*', { count: 'exact' })
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (country) query = query.ilike('country', `%${country}%`);
    if (type) query = query.eq('type', type);

    const { data, count } = await query;
    return {
      success: true,
      data: data || [],
      pagination: { total: count || 0, limit, offset, hasMore: offset + (data?.length || 0) < (count || 0) },
    };
  }

  async getScholarshipById(id: string) {
    const { data } = await this.db.from('Scholarship').select('*').eq('id', id).single();
    return { success: true, data };
  }

  async getScholarshipsByCountry(country: string) {
    const { data } = await this.db
      .from('Scholarship')
      .select('*')
      .ilike('country', country)
      .eq('isActive', true)
      .order('createdAt', { ascending: false });
    return { success: true, data: data || [] };
  }

  // ==================== COURSES ====================

  async getAllCourses(filters: any) {
    const { level, field, limit = 20, offset = 0 } = filters;

    let query = this.db
      .from('Course')
      .select('*', { count: 'exact' })
      .order('isPopular', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (level) query = query.ilike('level', `%${level}%`);
    if (field) query = query.ilike('field', `%${field}%`);

    const { data, count } = await query;
    return {
      success: true,
      data: data || [],
      pagination: { total: count || 0, limit, offset, hasMore: offset + (data?.length || 0) < (count || 0) },
    };
  }

  async getPopularCourses() {
    const { data } = await this.db
      .from('Course')
      .select('*')
      .eq('isPopular', true)
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  async getCourseById(id: string) {
    const { data } = await this.db.from('Course').select('*').eq('id', id).single();
    return { success: true, data };
  }

  async getCoursesByLevel(level: string) {
    const { data } = await this.db
      .from('Course')
      .select('*')
      .ilike('level', `%${level}%`)
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }

  async getCoursesByField(field: string) {
    const { data } = await this.db
      .from('Course')
      .select('*')
      .ilike('field', `%${field}%`)
      .order('name', { ascending: true });
    return { success: true, data: data || [] };
  }
}

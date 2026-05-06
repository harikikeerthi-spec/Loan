import { Injectable, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCohortApplicationDto } from './dto/create-cohort-application.dto';

@Injectable()
export class ConnectedService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private readonly supabase: SupabaseService) {}

  async create(dto: CreateCohortApplicationDto) {
    const { data: existing } = await this.db
      .from('CohortApplication')
      .select('id')
      .eq('email', dto.email)
      .eq('targetIntake', dto.targetIntake)
      .single();

    if (existing) {
      throw new ConflictException(
        'An application with this email already exists for the selected intake.',
      );
    }

    const { data: application, error } = await this.db
      .from('CohortApplication')
      .insert({
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        targetIntake: dto.targetIntake,
        destination: dto.destination,
        university: dto.university,
        course: dto.course,
        gapYear: dto.gapYear ?? false,
        message: dto.message,
        source: dto.source ?? 'connectED',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, id: application.id };
  }

  async findAll(status?: string) {
    let query = this.db
      .from('CohortApplication')
      .select('*')
      .order('createdAt', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data } = await query;
    return data || [];
  }

  async updateStatus(id: string, status: string, reviewedBy?: string, reviewNotes?: string) {
    const { data, error } = await this.db
      .from('CohortApplication')
      .update({ status, reviewedBy, reviewNotes, reviewedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

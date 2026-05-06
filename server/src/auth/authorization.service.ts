import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

// Simple User type (replaces @prisma/client User)
export type AppUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  [key: string]: any;
};

@Injectable()
export class AuthorizationService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

  async canEditBlog(blogId: string, user: AppUser): Promise<boolean> {
    const { data: blog } = await this.db
      .from('Blog')
      .select('authorId')
      .eq('id', blogId)
      .single();

    if (!blog) throw new Error('Blog not found');

    if (user.role === 'super_admin') return true;

    if (blog.authorId !== user.id) {
      throw new Error("Cannot edit another admin's blog");
    }

    return true;
  }

  async canViewBlog(blogId: string, user: AppUser): Promise<boolean> {
    const { data: blog } = await this.db
      .from('Blog')
      .select('authorId, status, visibility')
      .eq('id', blogId)
      .single();

    if (!blog) return false;
    if (user.role === 'super_admin') return true;
    if (blog.authorId === user.id) return true;
    if (blog.status === 'published' && blog.visibility === 'public') return true;
    return false;
  }

  async canDeleteBlog(blogId: string, user: AppUser): Promise<boolean> {
    const { data: blog } = await this.db
      .from('Blog')
      .select('authorId')
      .eq('id', blogId)
      .single();

    if (!blog) throw new Error('Blog not found');
    if (user.role === 'super_admin') return true;
    if (blog.authorId !== user.id) {
      throw new Error("Cannot delete another admin's blog");
    }
    return true;
  }

  getVisibilityFilter(user: AppUser, scope?: 'own' | 'other' | 'all') {
    // Returns a filter descriptor for Supabase usage in the calling service
    return { role: user.role, userId: user.id, scope };
  }

  getPublicFilter() {
    return {
      isPublished: true,
      visibility: 'public',
    };
  }
}

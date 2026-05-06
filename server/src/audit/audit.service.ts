import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuditService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

  async getRecentActivity(limit = 20) {
    try {
      const [
        appsRes,
        blogsRes,
        postsRes,
        usersRes,
        mentorsRes,
      ] = await Promise.all([
        this.db.from('LoanApplication').select('id, applicationNumber, status, submittedAt, user:User!userId(firstName, lastName)').order('submittedAt', { ascending: false }).limit(limit),
        this.db.from('Blog').select('id, title, authorName, publishedAt, createdAt').eq('isPublished', true).order('publishedAt', { ascending: false }).limit(limit),
        this.db.from('ForumPost').select('id, title, createdAt, author:User!authorId(firstName, lastName)').order('createdAt', { ascending: false }).limit(limit),
        this.db.from('User').select('id, firstName, lastName, email, createdAt').order('createdAt', { ascending: false }).limit(limit),
        this.db.from('Mentor').select('id, name, expertise, createdAt').order('createdAt', { ascending: false }).limit(limit),
      ]);

      const applications = appsRes.data || [];
      const blogs = blogsRes.data || [];
      const forumPosts = postsRes.data || [];
      const users = usersRes.data || [];
      const mentors = mentorsRes.data || [];

      if (appsRes.error) console.error('[AuditService] App query error:', appsRes.error);
      if (blogsRes.error) console.error('[AuditService] Blog query error:', blogsRes.error);
      if (postsRes.error) console.error('[AuditService] Forum query error:', postsRes.error);
      if (usersRes.error) console.error('[AuditService] User query error:', usersRes.error);
      if (mentorsRes.error) console.error('[AuditService] Mentor query error:', mentorsRes.error);

    const formatName = (f: string | null, l: string | null) =>
      `${f || ''} ${l || ''}`.trim() || 'Unknown User';

    const activities = [
      ...(applications || []).map((app: any) => ({
        id: app.id,
        type: 'application',
        title: `Application #${app.applicationNumber}`,
        description: `${formatName(app.user?.firstName, app.user?.lastName)} - ${app.status}`,
        status: app.status,
        date: app.submittedAt,
        link: '#',
      })),
      ...(blogs || []).map((blog: any) => ({
        id: blog.id,
        type: 'blog',
        title: `Blog Published: ${blog.title}`,
        description: `By ${blog.authorName}`,
        status: 'published',
        date: blog.publishedAt || blog.createdAt,
        link: `/blog/${blog.id}`,
      })),
      ...(forumPosts || []).map((post: any) => ({
        id: post.id,
        type: 'forum',
        title: `Forum Post: ${post.title}`,
        description: `By ${formatName(post.author?.firstName, post.author?.lastName)}`,
        status: 'discussion',
        date: post.createdAt,
        link: `/community/forum/${post.id}`,
      })),
      ...(users || []).map((user: any) => ({
        id: user.id,
        type: 'user',
        title: `New User Joined`,
        description: `${formatName(user.firstName, user.lastName)} (${user.email})`,
        status: 'active',
        date: user.createdAt,
        link: `/user/${user.id}`,
      })),
      ...(mentors || []).map((mentor: any) => ({
        id: mentor.id,
        type: 'mentor',
        title: `New Mentor Profile`,
        description: `${mentor.name} - ${(mentor.expertise || []).join(', ')}`,
        status: 'pending',
        date: mentor.createdAt,
        link: `/mentor/${mentor.id}`,
      })),
    ];

      return activities
        .sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('[AuditService.getRecentActivity] Fatal error:', error);
      return [];
    }
  }
}

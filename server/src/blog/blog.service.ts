// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BlogService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

  private normalizeTagName(tag: string) {
    return (tag || '').trim().replace(/^#/, '').toLowerCase();
  }

  private slugifyTag(tag: string) {
    return this.normalizeTagName(tag).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private async upsertTags(tagNames: string[]) {
    const normalized = Array.from(new Set((tagNames || []).map((t) => this.normalizeTagName(t)).filter(Boolean)));
    if (!normalized.length) return [];

    return Promise.all(
      normalized.map(async (name) => {
        const { data: existing } = await this.db.from('Tag').select('id').eq('name', name).single();
        if (existing) return existing;
        const { data: created } = await this.db.from('Tag').insert({ name, slug: this.slugifyTag(name) }).select('id').single();
        return created;
      }),
    );
  }

  private mapTags(blog: any) {
    if (!blog) return blog;
    return {
      ...blog,
      tags: (blog.tags || []).map((t: any) => (t.tag ? t.tag.name : t.name || t)),
    };
  }

  async getAllBlogs(options?: { category?: string; featured?: boolean; limit?: number; offset?: number }) {
    const { category, featured, limit = 10, offset = 0 } = options || {};

    let query = this.db
      .from('Blog')
      .select('id, title, slug, excerpt, category, authorName, authorImage, authorRole, featuredImage, readTime, views, isFeatured, publishedAt, createdAt, tags:BlogTag(tag:Tag(name))', { count: 'exact' })
      .eq('isPublished', true)
      .order('isFeatured', { ascending: false })
      .order('publishedAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (featured !== undefined) query = query.eq('isFeatured', featured);

    const { data: blogs, count } = await query;
    return {
      success: true,
      data: (blogs || []).map((b) => this.mapTags(b)),
      pagination: { total: count || 0, limit, offset, hasMore: offset + (blogs?.length || 0) < (count || 0) },
    };
  }

  async getFeaturedBlog() {
    const { data: blog } = await this.db
      .from('Blog')
      .select('id, title, slug, excerpt, category, authorName, authorImage, authorRole, featuredImage, readTime, views, publishedAt, tags:BlogTag(tag:Tag(name))')
      .eq('isPublished', true)
      .eq('isFeatured', true)
      .order('publishedAt', { ascending: false })
      .limit(1)
      .single();

    if (!blog) return { success: false, message: 'No featured blog found', data: null };
    return { success: true, data: this.mapTags(blog) };
  }

  async getBlogBySlug(slug: string) {
    const { data: blog } = await this.db
      .from('Blog')
      .select('id, title, slug, excerpt, content, category, authorName, authorImage, authorRole, featuredImage, readTime, views, publishedAt, createdAt, updatedAt, tags:BlogTag(tag:Tag(name)), comments:Comment(id, author, content, createdAt)')
      .eq('slug', slug)
      .single();

    if (!blog) throw new NotFoundException('Blog not found');

    // Increment view count (fire-and-forget)
    this.db.from('Blog').update({ views: (blog.views || 0) + 1 }).eq('slug', slug).then(() => {});

    return { success: true, data: this.mapTags(blog) };
  }

  async getBlogById(id: string) {
    const { data: blog } = await this.db
      .from('Blog')
      .select('id, title, slug, excerpt, content, category, authorName, authorImage, authorRole, featuredImage, readTime, views, isFeatured, isPublished, publishedAt, createdAt, updatedAt, tags:BlogTag(tag:Tag(name))')
      .eq('id', id)
      .single();

    if (!blog) throw new NotFoundException('Blog not found');
    return { success: true, data: this.mapTags(blog) };
  }

  async getPopularBlogs(limit = 10) {
    const { data: blogs } = await this.db
      .from('Blog')
      .select('id, title, slug, excerpt, category, authorName, authorImage, featuredImage, readTime, views, publishedAt, tags:BlogTag(tag:Tag(name))')
      .eq('isPublished', true)
      .order('views', { ascending: false })
      .limit(limit);
    return { success: true, data: (blogs || []).map((b) => this.mapTags(b)) };
  }

  async getBlogStats(id: string) {
    const { data: blog } = await this.db
      .from('Blog')
      .select('id, title, slug, views, category, publishedAt, createdAt, updatedAt, isFeatured, isPublished')
      .eq('id', id)
      .single();

    if (!blog) throw new NotFoundException('Blog not found');
    return {
      success: true,
      data: {
        ...blog,
        daysSincePublished: blog.publishedAt
          ? Math.floor((Date.now() - new Date(blog.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      },
    };
  }

  async incrementBlogView(id: string) {
    const { data: blog } = await this.db.from('Blog').select('views').eq('id', id).single();
    if (!blog) throw new NotFoundException('Blog not found');
    const { data: updated } = await this.db.from('Blog').update({ views: (blog.views || 0) + 1 }).eq('id', id).select('views').single();
    return { success: true, views: updated?.views };
  }

  async getCategories() {
    const { data: blogs } = await this.db.from('Blog').select('category').eq('isPublished', true);
    const counts: Record<string, number> = {};
    for (const b of blogs || []) {
      counts[b.category] = (counts[b.category] || 0) + 1;
    }
    return { success: true, data: Object.entries(counts).map(([name, count]) => ({ name, count })) };
  }

  async getRelatedBlogs(category: string, excludeSlug: string, limit = 3) {
    const { data: blogs } = await this.db
      .from('Blog')
      .select('id, title, slug, excerpt, category, featuredImage, readTime, publishedAt, tags:BlogTag(tag:Tag(name))')
      .eq('isPublished', true)
      .eq('category', category)
      .neq('slug', excludeSlug)
      .order('publishedAt', { ascending: false })
      .limit(limit);
    return { success: true, data: (blogs || []).map((b) => this.mapTags(b)) };
  }

  async createBlog(data: any) {
    if (!data.slug) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const { tags = [], ...rest } = data;
    const { data: blog, error } = await this.db
      .from('Blog')
      .insert({
        ...rest,
        publishedAt: rest.isPublished ? new Date().toISOString() : null,
      })
      .select('id, title, slug, excerpt, content, category, authorName, authorImage, authorRole, featuredImage, readTime, isFeatured, isPublished, publishedAt, createdAt')
      .single();

    if (error) throw error;

    if (tags.length > 0) {
      const tagRecords = await this.upsertTags(tags);
      await this.db.from('BlogTag').insert(tagRecords.filter(Boolean).map((t) => ({ blogId: blog.id, tagId: t.id })));
    }

    const { data: finalBlog } = await this.db
      .from('Blog')
      .select('*, tags:BlogTag(tag:Tag(name))')
      .eq('id', blog.id)
      .single();

    return { success: true, message: 'Blog created successfully', data: this.mapTags(finalBlog) };
  }

  async updateBlog(id: string, data: any) {
    const { data: existingBlog } = await this.db.from('Blog').select('id, publishedAt').eq('id', id).single();
    if (!existingBlog) throw new NotFoundException('Blog not found');

    const { tags, ...rest } = data;
    const updateData: any = { ...rest };
    if (data.isPublished && !existingBlog.publishedAt) {
      updateData.publishedAt = new Date().toISOString();
    }

    await this.db.from('Blog').update(updateData).eq('id', id);

    if (tags !== undefined) {
      const tagRecords = await this.upsertTags(tags);
      await this.db.from('BlogTag').delete().eq('blogId', id);
      if (tagRecords.length) {
        await this.db.from('BlogTag').insert(tagRecords.filter(Boolean).map((t) => ({ blogId: id, tagId: t.id })));
      }
    }

    const { data: blog } = await this.db.from('Blog').select('*, tags:BlogTag(tag:Tag(name))').eq('id', id).single();
    return { success: true, message: 'Blog updated successfully', data: this.mapTags(blog) };
  }

  async deleteBlog(id: string) {
    const { data: blog } = await this.db.from('Blog').select('id').eq('id', id).single();
    if (!blog) throw new NotFoundException('Blog not found');
    await this.db.from('Blog').delete().eq('id', id);
    return { success: true, message: 'Blog deleted successfully' };
  }

  async searchBlogs(query: string, limit = 10) {
    const { data: blogs } = await this.db
      .from('Blog')
      .select('id, title, slug, excerpt, category, featuredImage, readTime, publishedAt, tags:BlogTag(tag:Tag(name))')
      .eq('isPublished', true)
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
      .order('publishedAt', { ascending: false })
      .limit(limit);
    return { success: true, data: (blogs || []).map((b) => this.mapTags(b)), count: blogs?.length || 0 };
  }

  async getAllTags(limit?: number) {
    const { data: tags } = await this.db
      .from('Tag')
      .select('id, name, slug, blogs:BlogTag(blogId, blog:Blog(isPublished))')
      .order('name', { ascending: true });

    let tagsWithCount = (tags || [])
      .map((tag: any) => ({
        name: tag.name,
        slug: tag.slug,
        count: (tag.blogs || []).filter((b: any) => b.blog?.isPublished).length,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count);

    if (limit) tagsWithCount = tagsWithCount.slice(0, limit);
    return { success: true, data: tagsWithCount };
  }

  async searchBlogsByTag(tag: string, limit = 10, offset = 0) {
    const normalizedTag = this.normalizeTagName(tag);
    if (!normalizedTag) return { success: true, data: [], count: 0, pagination: { total: 0, limit, offset, hasMore: false } };

    // Get all blogs with the tag via junction table
    const { data: tagRecord } = await this.db.from('Tag').select('id').eq('name', normalizedTag).single();
    if (!tagRecord) return { success: true, data: [], count: 0, pagination: { total: 0, limit, offset, hasMore: false } };

    const { data: blogTags } = await this.db.from('BlogTag').select('blogId').eq('tagId', tagRecord.id);
    const blogIds = (blogTags || []).map((bt: any) => bt.blogId);
    if (!blogIds.length) return { success: true, data: [], count: 0, pagination: { total: 0, limit, offset, hasMore: false } };

    const { data: blogs, count } = await this.db
      .from('Blog')
      .select('id, title, slug, excerpt, category, featuredImage, readTime, publishedAt, tags:BlogTag(tag:Tag(name))', { count: 'exact' })
      .eq('isPublished', true)
      .in('id', blogIds)
      .order('publishedAt', { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      success: true,
      data: (blogs || []).map((b) => this.mapTags(b)),
      count: count || 0,
      pagination: { total: count || 0, limit, offset, hasMore: offset + (blogs?.length || 0) < (count || 0) },
    };
  }

  async addCommentToBlog(blogId: string, data: { author: string; content: string }) {
    const { data: blog } = await this.db.from('Blog').select('id').eq('id', blogId).single();
    if (!blog) throw new NotFoundException('Blog not found');

    const { data: comment, error } = await this.db
      .from('Comment')
      .insert({ blogId, author: data.author, content: data.content })
      .select('id, author, content, createdAt')
      .single();

    if (error) throw error;
    return { success: true, message: 'Comment added successfully', data: comment };
  }

  async addReplyToComment(commentId: string, data: { author: string; content: string }) {
    const { data: parent } = await this.db.from('Comment').select('id, blogId').eq('id', commentId).single();
    if (!parent) throw new NotFoundException('Comment not found');

    const { data: reply, error } = await this.db
      .from('Comment')
      .insert({ blogId: parent.blogId, parentId: commentId, author: data.author, content: data.content })
      .select('id, author, content, likes, createdAt')
      .single();

    if (error) throw error;
    return { success: true, message: 'Reply added successfully', data: reply };
  }

  async deleteComment(commentId: string) {
    const { data: comment } = await this.db.from('Comment').select('id').eq('id', commentId).single();
    if (!comment) throw new NotFoundException('Comment not found');

    // Delete likes and replies first, then the comment
    await this.db.from('CommentLike').delete().eq('commentId', commentId);
    await this.db.from('Comment').delete().eq('parentId', commentId);
    await this.db.from('Comment').delete().eq('id', commentId);

    return { success: true, message: 'Comment deleted successfully' };
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const { data: comment } = await this.db.from('Comment').select('id, likes').eq('id', commentId).single();
    if (!comment) throw new NotFoundException('Comment not found');

    const { data: existing } = await this.db
      .from('CommentLike')
      .select('id')
      .eq('commentId', commentId)
      .eq('userId', userId)
      .single();

    const currentLikes = comment.likes || 0;

    if (existing) {
      await this.db.from('CommentLike').delete().eq('id', existing.id);
      await this.db.from('Comment').update({ likes: Math.max(0, currentLikes - 1) }).eq('id', commentId);
      return { success: true, message: 'Comment unliked', liked: false, likesCount: Math.max(0, currentLikes - 1) };
    } else {
      await this.db.from('CommentLike').insert({ commentId, userId });
      await this.db.from('Comment').update({ likes: currentLikes + 1 }).eq('id', commentId);
      return { success: true, message: 'Comment liked', liked: true, likesCount: currentLikes + 1 };
    }
  }

  async getCommentsForBlog(blogId: string, limit = 20, offset = 0) {
    const { data: blog } = await this.db.from('Blog').select('id').eq('id', blogId).single();
    if (!blog) throw new NotFoundException('Blog not found');

    const { data: comments, count } = await this.db
      .from('Comment')
      .select('id, author, content, likes, createdAt, replies:Comment!parentId(id, author, content, likes, createdAt)', { count: 'exact' })
      .eq('blogId', blogId)
      .is('parentId', null)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    const total = count || 0;
    return {
      success: true,
      data: comments || [],
      pagination: { total, limit, offset, hasMore: offset + (comments?.length || 0) < total },
    };
  }

  // ==================== ADMIN METHODS ====================

  async getAllBlogsAdmin(options?: { limit?: number; offset?: number }) {
    const { limit = 50, offset = 0 } = options || {};

    const { data: blogs, count } = await this.db
      .from('Blog')
      .select('id, title, slug, excerpt, content, category, authorName, authorImage, authorRole, featuredImage, readTime, views, isFeatured, isPublished, publishedAt, createdAt, updatedAt, tags:BlogTag(tag:Tag(name))', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      success: true,
      data: (blogs || []).map((b) => this.mapTags(b)),
      pagination: { total: count || 0, limit, offset, hasMore: offset + (blogs?.length || 0) < (count || 0) },
    };
  }

  async getBlogStatistics() {
    const [
      { count: total },
      { count: published },
      { count: draft },
      { count: featured },
      { data: viewsData },
    ] = await Promise.all([
      this.db.from('Blog').select('*', { count: 'exact', head: true }),
      this.db.from('Blog').select('*', { count: 'exact', head: true }).eq('isPublished', true),
      this.db.from('Blog').select('*', { count: 'exact', head: true }).eq('isPublished', false),
      this.db.from('Blog').select('*', { count: 'exact', head: true }).eq('isFeatured', true).eq('isPublished', true),
      this.db.from('Blog').select('views'),
    ]);

    const totalViews = (viewsData || []).reduce((sum: number, b: any) => sum + (b.views || 0), 0);
    return { success: true, data: { total: total || 0, published: published || 0, draft: draft || 0, featured: featured || 0, totalViews } };
  }

  async bulkDeleteBlogs(blogIds: string[]) {
    if (!blogIds || blogIds.length === 0) return { success: false, message: 'No blog IDs provided' };
    const { error } = await this.db.from('Blog').delete().in('id', blogIds);
    if (error) throw error;
    return { success: true, message: `${blogIds.length} blog(s) deleted successfully`, deleted: blogIds.length };
  }

  async bulkUpdateStatus(blogIds: string[], isPublished: boolean) {
    if (!blogIds || blogIds.length === 0) return { success: false, message: 'No blog IDs provided' };

    const updateData: any = { isPublished };
    if (isPublished) {
      // Set publishedAt only for blogs that don't have it yet
      const { data: withoutDate } = await this.db.from('Blog').select('id').in('id', blogIds).is('publishedAt', null);
      const withoutDateIds = (withoutDate || []).map((b: any) => b.id);
      if (withoutDateIds.length) {
        await this.db.from('Blog').update({ isPublished: true, publishedAt: new Date().toISOString() }).in('id', withoutDateIds);
      }
      const withDateIds = blogIds.filter((id) => !withoutDateIds.includes(id));
      if (withDateIds.length) {
        await this.db.from('Blog').update({ isPublished: true }).in('id', withDateIds);
      }
      return { success: true, message: `${blogIds.length} blog(s) published successfully`, updated: blogIds.length };
    } else {
      await this.db.from('Blog').update({ isPublished: false }).in('id', blogIds);
      return { success: true, message: `${blogIds.length} blog(s) unpublished successfully`, updated: blogIds.length };
    }
  }

  async submitForApproval(blogId: string, notes?: string) {
    const { data: blog } = await this.db.from('Blog').select('id, status').eq('id', blogId).single();
    if (!blog) throw new Error('Blog not found');
    if (blog.status !== 'draft') throw new Error('Only draft blogs can be submitted for approval');
    const { data, error } = await this.db
      .from('Blog')
      .update({ status: 'pending', submittedAt: new Date().toISOString() })
      .eq('id', blogId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async publishBlog(blogId: string, visibility: 'private' | 'public' = 'public') {
    const { data: blog } = await this.db.from('Blog').select('id').eq('id', blogId).single();
    if (!blog) throw new Error('Blog not found');
    const { data, error } = await this.db
      .from('Blog')
      .update({ status: 'published', visibility, isPublished: visibility === 'public', publishedAt: new Date().toISOString() })
      .eq('id', blogId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async unpublishBlog(blogId: string, reason?: string) {
    const { data: blog } = await this.db.from('Blog').select('id, status').eq('id', blogId).single();
    if (!blog) throw new Error('Blog not found');
    if (blog.status !== 'published') throw new Error('Only published blogs can be unpublished');
    const { data, error } = await this.db
      .from('Blog')
      .update({ status: 'draft', isPublished: false, publishedAt: null })
      .eq('id', blogId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async approveBlog(blogId: string, approvedBy: string, notes?: string) {
    const { data, error } = await this.db
      .from('Blog')
      .update({ approvedAt: new Date().toISOString(), approvedBy })
      .eq('id', blogId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async rejectBlog(blogId: string, reason: string) {
    const { data, error } = await this.db
      .from('Blog')
      .update({ status: 'draft', rejectionReason: reason, approvedAt: null, approvedBy: null })
      .eq('id', blogId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getAdminBlogs(filter: any, options: { limit?: number; offset?: number } = {}) {
    const { limit = 20, offset = 0 } = options;

    let query = this.db
      .from('Blog')
      .select('id, title, slug, excerpt, category, authorName, authorImage, authorRole, authorId, featuredImage, status, visibility, isPublished, readTime, views, publishedAt, createdAt, updatedAt, tags:BlogTag(tag:Tag(name))', { count: 'exact' })
      .order('updatedAt', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filter conditions
    if (filter.isPublished !== undefined) query = query.eq('isPublished', filter.isPublished);
    if (filter.status) query = query.eq('status', filter.status);
    if (filter.authorId) query = query.eq('authorId', filter.authorId);

    const { data: blogs, count } = await query;
    return {
      success: true,
      data: (blogs || []).map((b) => this.mapTags(b)),
      pagination: { total: count || 0, limit, offset, hasMore: offset + (blogs?.length || 0) < (count || 0) },
    };
  }

  async getAdminBlogDetail(blogId: string) {
    const { data } = await this.db
      .from('Blog')
      .select('*, tags:BlogTag(tag:Tag(name))')
      .eq('id', blogId)
      .single();
    return data ? this.mapTags(data) : null;
  }
}

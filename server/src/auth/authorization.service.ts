import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthorizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user can edit a blog
   */
  async canEditBlog(blogId: string, user: User): Promise<boolean> {
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
      select: { authorId: true },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Super admin can edit any blog
    if (user.role === 'super_admin') {
      return true;
    }

    // Regular admin can only edit own blogs
    if (blog.authorId !== user.id) {
      throw new ForbiddenException('Cannot edit another admin\'s blog');
    }

    return true;
  }

  /**
   * Check if user can view a blog (in admin context)
   */
  async canViewBlog(blogId: string, user: User): Promise<boolean> {
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
      select: { authorId: true, status: true, visibility: true },
    });

    if (!blog) {
      return false;
    }

    // Super admin can view any blog
    if (user.role === 'super_admin') {
      return true;
    }

    // Own blog: view all statuses
    if (blog.authorId === user.id) {
      return true;
    }

    // Other admin's blog: only view if published
    if (blog.status === 'published' && blog.visibility === 'public') {
      return true;
    }

    return false;
  }

  /**
   * Check if user can delete a blog
   */
  async canDeleteBlog(blogId: string, user: User): Promise<boolean> {
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
      select: { authorId: true },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Super admin can delete any blog
    if (user.role === 'super_admin') {
      return true;
    }

    // Regular admin can only delete own blogs
    if (blog.authorId !== user.id) {
      throw new ForbiddenException('Cannot delete another admin\'s blog');
    }

    return true;
  }

  /**
   * Get visibility filters for blog queries (scoped to user's permissions)
   */
  getVisibilityFilter(user: User, scope?: 'own' | 'other' | 'all') {
    if (user.role === 'super_admin') {
      // Super admin sees all
      return {};
    }

    if (scope === 'own') {
      return { authorId: user.id };
    }

    if (scope === 'other') {
      return {
        authorId: { not: user.id },
        isPublished: true,
        visibility: 'public',
      };
    }

    if (scope === 'all') {
      return {
        OR: [
          { authorId: user.id },
          {
            AND: [
              { authorId: { not: user.id } },
              { isPublished: true },
              { visibility: 'public' },
            ],
          },
        ],
      };
    }

    return {};
  }

  /**
   * Get filter for public blog listing (no auth required)
   */
  getPublicFilter() {
    return {
      isPublished: true,
      visibility: 'public',
      publishedAt: { lte: new Date() }, // Embargo support
    };
  }
}

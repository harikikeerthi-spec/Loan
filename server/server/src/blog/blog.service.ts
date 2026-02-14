// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) { }

  /**
   * Get all published blogs with basic info (title, excerpt, category, etc.)
   * Used for blog listing page
   */
  async getAllBlogs(options?: {
    category?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const { category, featured, limit = 10, offset = 0 } = options || {};

    const where: any = {
      isPublished: true,
    };

    if (category) {
      where.category = category;
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    const blogs = await this.prisma.blog.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        authorName: true,
        authorImage: true,
        authorRole: true,
        featuredImage: true,
        readTime: true,
        views: true,
        isFeatured: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.blog.count({ where });

    return {
      success: true,
      data: blogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + blogs.length < total,
      },
    };
  }

  /**
   * Get featured blog (for homepage/blog listing hero)
   */
  async getFeaturedBlog() {
    const blog = await this.prisma.blog.findFirst({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        authorName: true,
        authorImage: true,
        authorRole: true,
        featuredImage: true,
        readTime: true,
        views: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    if (!blog) {
      return {
        success: false,
        message: 'No featured blog found',
        data: null,
      };
    }

    return {
      success: true,
      data: blog,
    };
  }

  /**
   * Get full blog by slug (for individual blog page)
   * Includes full content
   */
  async getBlogBySlug(slug: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        category: true,
        authorName: true,
        authorImage: true,
        authorRole: true,
        featuredImage: true,
        readTime: true,
        views: true,
        publishedAt: true,
        isPublished: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        comments: {
          include: {
            replies: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Increment view count
    await this.prisma.blog.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    return {
      success: true,
      data: blog,
    };
  }

  /**
   * Get blog by ID
   */
  async getBlogById(id: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        category: true,
        authorName: true,
        authorImage: true,
        authorRole: true,
        featuredImage: true,
        readTime: true,
        views: true,
        isFeatured: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        comments: {
          include: {
            replies: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return {
      success: true,
      data: blog,
    };
  }

  /**
   * Get all categories with blog count
   */
  async getCategories() {
    const categories = await this.prisma.blog.groupBy({
      by: ['category'],
      where: {
        isPublished: true,
      },
      _count: {
        category: true,
      },
    });

    return {
      success: true,
      data: categories.map((c) => ({
        name: c.category,
        count: c._count.category,
      })),
    };
  }

  /**
   * Get related blogs by category (excluding current blog)
   */
  async getRelatedBlogs(category: string, excludeSlug: string, limit = 3) {
    const blogs = await this.prisma.blog.findMany({
      where: {
        isPublished: true,
        category,
        slug: { not: excludeSlug },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        featuredImage: true,
        readTime: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: blogs,
    };
  }

  /**
   * Create a new blog post
   */
  async createBlog(data: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    authorName: string;
    authorImage?: string;
    authorRole?: string;
    featuredImage?: string;
    readTime?: number;
    isFeatured?: boolean;
    isPublished?: boolean;
    authorId?: string;
  }) {
    // Generate slug from title if not provided
    if (!data.slug) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const { isPublished, isFeatured, ...rest } = data;
    const blog = await this.prisma.blog.create({
      data: {
        ...rest,
        published: isPublished,
        featured: isFeatured,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return {
      success: true,
      message: 'Blog created successfully',
      data: blog,
    };
  }

  /**
   * Update a blog post
   */
  async updateBlog(
    id: string,
    data: {
      title?: string;
      slug?: string;
      excerpt?: string;
      content?: string;
      category?: string;
      authorName?: string;
      authorImage?: string;
      authorRole?: string;
      featuredImage?: string;
      readTime?: number;
      isFeatured?: boolean;
      isPublished?: boolean;
    },
  ) {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      throw new NotFoundException('Blog not found');
    }

    // Set publishedAt if publishing for the first time
    if (data.isPublished && !existingBlog.publishedAt) {
      (data as any).publishedAt = new Date();
    }

    const { isPublished, isFeatured, ...rest } = data;
    const updateData: any = { ...rest };
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const blog = await this.prisma.blog.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Blog updated successfully',
      data: blog,
    };
  }

  /**
   * Delete a blog post
   */
  async deleteBlog(id: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    await this.prisma.blog.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Blog deleted successfully',
    };
  }

  /**
   * Search blogs by title or content
   */
  async searchBlogs(query: string, limit = 10) {
    const blogs = await this.prisma.blog.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        featuredImage: true,
        readTime: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: blogs,
      count: blogs.length,
    };
  }

  /**
   * Add a comment to a blog
   */
  async addComment(
    blogId: string,
    data: { content: string; authorName: string },
  ) {
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: data.content,
        author: data.authorName,
        blogId: blogId,
      },
    });

    return {
      success: true,
      data: comment,
    };
  }

  /**
   * Delete a comment
   */
  async deleteComment(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Comment deleted successfully',
    };
  }

  /**
   * Toggle like on a comment
   */
  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { likes: { increment: 1 } },
    });

    return {
      success: true,
      data: updatedComment,
    };
  }

  /**
   * Add a reply to a comment
   */
  async addReply(
    commentId: string,
    data: { content: string; authorName: string },
  ) {
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    const reply = await this.prisma.comment.create({
      data: {
        content: data.content,
        author: data.authorName,
        parentId: commentId,
        blogId: parentComment.blogId,
      },
    });

    return {
      success: true,
      data: reply,
    };
  }
}

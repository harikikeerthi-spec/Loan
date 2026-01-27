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
            published: true,
        };

        if (category) {
            where.category = category;
        }

        if (featured !== undefined) {
            where.featured = featured;
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
                featured: true,
                publishedAt: true,
                createdAt: true,
            },
            orderBy: [
                { featured: 'desc' },
                { publishedAt: 'desc' },
            ],
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
                published: true,
                featured: true,
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
                createdAt: true,
                updatedAt: true,
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
                published: true,
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
                published: true,
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
        if (isPublished !== undefined) updateData.published = isPublished;
        if (isFeatured !== undefined) updateData.featured = isFeatured;

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
                published: true,
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
}

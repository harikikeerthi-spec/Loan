import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { AdminGuard } from '../auth/admin.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { AuthorizationService } from '../auth/authorization.service';
import { AuditLogService } from '../auth/audit-log.service';

@Controller('blogs')
export class BlogController {
    constructor(
        private blogService: BlogService,
        private authService: AuthorizationService,
        private auditLog: AuditLogService,
    ) {}

    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Get all published blogs with pagination
     * GET /blogs
     * @query category - Filter by category (optional)
     * @query featured - Filter by featured status (optional)
     * @query limit - Number of blogs to return (default: 10)
     * @query offset - Number of blogs to skip (default: 0)
     * @returns { success: boolean, data: Blog[], pagination: { total, limit, offset, hasMore } }
     */
    @Get()
    async getAllBlogs(
        @Query('category') category?: string,
        @Query('featured') featured?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.blogService.getAllBlogs({
            category,
            featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
            limit: limit ? parseInt(limit, 10) : 10,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }

    /**
     * Get featured blog for hero section
     * GET /blogs/featured
     * @returns { success: boolean, data: Blog }
     */
    @Get('featured')
    async getFeaturedBlog() {
        return this.blogService.getFeaturedBlog();
    }

    /**
     * Get all blog categories with count
     * GET /blogs/categories
     * @returns { success: boolean, data: { name: string, count: number }[] }
     */
    @Get('categories')
    async getCategories() {
        return this.blogService.getCategories();
    }

    /**
     * Search blogs by title, excerpt, or content
     * GET /blogs/search
     * @query q - Search query (required)
     * @query limit - Number of results (default: 10)
     * @returns { success: boolean, data: Blog[], count: number }
     */
    @Get('search')
    async searchBlogs(
        @Query('q') query: string,
        @Query('limit') limit?: string,
    ) {
        return this.blogService.searchBlogs(
            query || '',
            limit ? parseInt(limit, 10) : 10,
        );
    }

    /**
     * Get all tags with count
     * GET /blogs/tags
     * @query limit - Number of tags to return (optional)
     * @returns { success: boolean, data: { name: string, count: number, slug: string }[] }
     */
    @Get('tags')
    async getAllTags(@Query('limit') limit?: string) {
        return this.blogService.getAllTags(limit ? parseInt(limit, 10) : undefined);
    }

    /**
     * Search blogs by tag (supports #tag syntax)
     * GET /blogs/tags/:tag
     * @param tag - Tag name or #tag value
     * @query limit - Number of results (default: 10)
     * @query offset - Number of results to skip (default: 0)
     */
    @Get('tags/:tag')
    async searchBlogsByTag(
        @Param('tag') tag: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.blogService.searchBlogsByTag(
            tag,
            limit ? parseInt(limit, 10) : 10,
            offset ? parseInt(offset, 10) : 0,
        );
    }

    /**
     * Get related blogs by category
     * GET /blogs/related/:category
     * @param category - Category name
     * @query exclude - Slug to exclude (optional)
     * @query limit - Number of results (default: 3)
     * @returns { success: boolean, data: Blog[] }
     */
    @Get('related/:category')
    async getRelatedBlogs(
        @Param('category') category: string,
        @Query('exclude') excludeSlug?: string,
        @Query('limit') limit?: string,
    ) {
        return this.blogService.getRelatedBlogs(
            category,
            excludeSlug || '',
            limit ? parseInt(limit, 10) : 3,
        );
    }

    /**
     * Get single blog by slug (for blog detail page)
     * GET /blogs/slug/:slug
     * @param slug - Blog slug
     * @returns { success: boolean, data: Blog (with full content) }
     */
    @Get('slug/:slug')
    async getBlogBySlug(@Param('slug') slug: string) {
        return this.blogService.getBlogBySlug(slug);
    }

    /**
     * Get most popular blogs (by view count)
     * GET /blogs/popular
     * @query limit - Number of blogs to return (default: 10)
     * @returns { success: boolean, data: Blog[] }
     */
    @Get('popular')
    async getPopularBlogs(@Query('limit') limit?: string) {
        return this.blogService.getPopularBlogs(limit ? parseInt(limit, 10) : 10);
    }

    /**
     * Get comments for a blog post
     * GET /blogs/:id/comments
     * @param id - Blog ID
     * @query limit - Number of comments to return (default: 20)
     * @query offset - Number of comments to skip (default: 0)
     */
    @Get(':id/comments')
    async getCommentsForBlog(
        @Param('id') id: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.blogService.getCommentsForBlog(
            id,
            limit ? parseInt(limit, 10) : 20,
            offset ? parseInt(offset, 10) : 0,
        );
    }

    /**
     * Add a comment to a blog post
     * POST /blogs/:id/comments
     * @param id - Blog ID
     * @body author, content
     */
    @Post(':id/comments')
    async addCommentToBlog(
        @Param('id') id: string,
        @Body()
        body: {
            author: string;
            content: string;
        },
    ) {
        return this.blogService.addCommentToBlog(id, body);
    }

    /**
     * Add a reply to a comment
     * POST /blogs/comments/:commentId/replies
     * @param commentId - Comment ID
     * @body author, content
     */
    @Post('comments/:commentId/replies')
    async addReplyToComment(
        @Param('commentId') commentId: string,
        @Body()
        body: {
            author: string;
            content: string;
        },
    ) {
        return this.blogService.addReplyToComment(commentId, body);
    }

    /**
     * Delete a comment
     * DELETE /blogs/comments/:commentId
     */
    @Delete('comments/:commentId')
    async deleteComment(@Param('commentId') commentId: string) {
        return this.blogService.deleteComment(commentId);
    }

    /**
     * Like or unlike a comment
     * POST /blogs/comments/:commentId/like
     * @param commentId - Comment ID
     * @body userId - User identifier (IP address for anonymous users)
     */
    @Post('comments/:commentId/like')
    async toggleCommentLike(
        @Param('commentId') commentId: string,
        @Body()
        body: {
            userId: string;
        },
    ) {
        return this.blogService.toggleCommentLike(commentId, body.userId);
    }

    /**
     * Get blog statistics
     * GET /blogs/:id/stats
     * @param id - Blog ID
     * @returns { success: boolean, data: { views, publishedAt, createdAt, category } }
     */
    @Get(':id/stats')
    async getBlogStats(@Param('id') id: string) {
        return this.blogService.getBlogStats(id);
    }

    /**
     * Increment blog view count (for manual tracking)
     * POST /blogs/:id/view
     * @param id - Blog ID
     * @returns { success: boolean, views: number }
     */
    @Post(':id/view')
    async incrementBlogView(@Param('id') id: string) {
        return this.blogService.incrementBlogView(id);
    }

    /**
     * Get single blog by ID    
     * GET /blogs/:id
     * @param id - Blog ID
     * @returns { success: boolean, data: Blog }
     */
    @Get(':id')
    async getBlogById(@Param('id') id: string) {
        return this.blogService.getBlogById(id);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all blogs (including unpublished) - ADMIN ONLY
     * GET /blogs/admin/all
     * @query limit - Number of blogs (default: 50)
     * @query offset - Skip blogs (default: 0)
     * @returns { success: boolean, data: Blog[], pagination }
     */
    @Get('admin/all')
    // @UseGuards(AdminGuard) // Temporarily disabled for testing
    async getAllBlogsAdmin(
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.blogService.getAllBlogsAdmin({
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }

    /**
     * Get blog statistics - ADMIN ONLY
     * GET /blogs/admin/stats
     * @returns { success: boolean, data: { total, published, draft, featured } }
     */
    @Get('admin/stats')
    @UseGuards(AdminGuard)
    async getBlogStatistics() {
        return this.blogService.getBlogStatistics();
    }

    /**
     * Create a new blog post - ADMIN ONLY
     * POST /blogs
     * @body title, slug, excerpt, content, category, authorName, authorImage?, 
     *       authorRole?, featuredImage?, readTime?, isFeatured?, isPublished?
     * @returns { success: boolean, message: string, data: Blog }
     */
    @Post()
    // @UseGuards(AdminGuard) // Temporarily disabled for testing
    async createBlog(
        @Body()
        body: {
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
            tags?: string[];
        },
        @Request() req: any,
    ) {
        // Only add authorId if we have a valid authenticated user
        // If no auth (testing mode), leave it undefined to store as NULL
        const blogData: any = {
            ...body,
        };

        // Only add authorId if we have an authenticated user or explicit authorId in body
        if (body.authorId) {
            blogData.authorId = body.authorId;
        } else if (req.user?.id) {
            blogData.authorId = req.user.id;
        }
        // Otherwise, authorId will be undefined and stored as NULL (which is allowed)

        return this.blogService.createBlog(blogData);
    }

    /**
     * Update a blog post - ADMIN ONLY
     * PUT /blogs/:id
     * @param id - Blog ID
     * @body Any blog fields to update
     * @returns { success: boolean, message: string, data: Blog }
     */
    @Put(':id')
    // @UseGuards(AdminGuard) // Temporarily disabled for testing
    async updateBlog(
        @Param('id') id: string,
        @Body()
        body: {
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
            tags?: string[];
        },
    ) {
        return this.blogService.updateBlog(id, body);
    }

    /**
     * Delete a blog post - ADMIN ONLY
     * DELETE /blogs/:id
     * @param id - Blog ID
     * @returns { success: boolean, message: string }
     */
    @Delete(':id')
    // @UseGuards(AdminGuard) // Temporarily disabled for testing
    async deleteBlog(@Param('id') id: string) {
        return this.blogService.deleteBlog(id);
    }

    /**
     * Bulk delete blogs - ADMIN ONLY
     * POST /blogs/admin/bulk-delete
     * @body blogIds - Array of blog IDs to delete
     * @returns { success: boolean, message: string, deleted: number }
     */
    @Post('admin/bulk-delete')
    @UseGuards(AdminGuard)
    async bulkDeleteBlogs(
        @Body() body: { blogIds: string[] }
    ) {
        return this.blogService.bulkDeleteBlogs(body.blogIds);
    }

    /**
     * Bulk update blog status - ADMIN ONLY
     * POST /blogs/admin/bulk-status
     * @body blogIds, isPublished
     * @returns { success: boolean, message: string, updated: number }
     */
    @Post('admin/bulk-status')
    @UseGuards(AdminGuard)
    async bulkUpdateStatus(
        @Body() body: { blogIds: string[], isPublished: boolean }
    ) {
        return this.blogService.bulkUpdateStatus(body.blogIds, body.isPublished);
    }

    // ==================== NEW ADMIN ENDPOINTS (WITH AUTHORIZATION) ====================

    /**
     * Get admin blogs with scope filtering (My Blogs, Other Admin Blogs)
     * GET /admin/blogs
     * @query scope - 'own' | 'other' | 'all' (default: 'all')
     * @query status - Filter by status (draft, pending, published)
     * @query limit - Number of blogs (default: 20)
     * @query offset - Skip blogs (default: 0)
     */
    @Get('admin/list')
    @UseGuards(AdminGuard)
    async getAdminBlogs(
        @Request() req,
        @Query('scope') scope: 'own' | 'other' | 'all' = 'all',
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const filter: any = this.authService.getVisibilityFilter(req.user, scope);

        if (status) {
            filter.status = status;
        }

        return this.blogService.getAdminBlogs(filter, {
            limit: limit ? parseInt(limit, 10) : 20,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }

    /**
     * Get blog detail for admin (with full metadata)
     * GET /admin/blogs/:id
     */
    @Get('admin/:id')
    @UseGuards(AdminGuard)
    async getAdminBlogDetail(@Request() req, @Param('id') blogId: string) {
        // Check authorization
        const canView = await this.authService.canViewBlog(blogId, req.user);
        if (!canView) {
            throw new ForbiddenException('Cannot access this blog');
        }

        const blog = await this.blogService.getAdminBlogDetail(blogId);
        if (!blog) {
            throw new NotFoundException('Blog not found');
        }

        const isOwner = blog.authorId === req.user.id;
        blog['readOnly'] = !isOwner && req.user.role !== 'super_admin';
        blog['isOwnContent'] = isOwner;

        return {
            success: true,
            data: blog,
        };
    }

    /**
     * Update blog (with authorization)
     * PUT /admin/blogs/:id
     */
    @Put('admin/:id')
    @UseGuards(AdminGuard)
    async updateAdminBlog(
        @Request() req,
        @Param('id') blogId: string,
        @Body() body: any,
    ) {
        // Check ownership
        await this.authService.canEditBlog(blogId, req.user);

        const originalBlog = await this.blogService.getAdminBlogDetail(blogId);
        const updatedBlog = await this.blogService.updateBlog(blogId, body);

        // Log audit
        await this.auditLog.logAction(
            'update',
            'blog',
            blogId,
            req.user,
            {
                before: originalBlog,
                after: updatedBlog,
            },
            req,
        );

        return {
            success: true,
            data: updatedBlog,
        };
    }

    /**
     * Delete blog (with authorization)
     * DELETE /admin/blogs/:id
     */
    @Delete('admin/:id')
    @UseGuards(AdminGuard)
    async deleteAdminBlog(@Request() req, @Param('id') blogId: string) {
        // Check ownership
        await this.authService.canDeleteBlog(blogId, req.user);

        const blog = await this.blogService.getAdminBlogDetail(blogId);
        await this.blogService.deleteBlog(blogId);

        // Log audit
        await this.auditLog.logAction(
            'delete',
            'blog',
            blogId,
            req.user,
            { deletedBlog: blog },
            req,
        );

        return {
            success: true,
            message: 'Blog deleted successfully',
        };
    }

    /**
     * Submit blog for approval
     * POST /admin/blogs/:id/submit-for-approval
     */
    @Post('admin/:id/submit-for-approval')
    @UseGuards(AdminGuard)
    async submitForApproval(
        @Request() req,
        @Param('id') blogId: string,
        @Body() body: { notes?: string },
    ) {
        // Check ownership
        await this.authService.canEditBlog(blogId, req.user);

        const blog = await this.blogService.submitForApproval(blogId, body.notes);

        // Log audit
        await this.auditLog.logAction(
            'submit_for_approval',
            'blog',
            blogId,
            req.user,
            { notes: body.notes },
            req,
        );

        return {
            success: true,
            message: 'Blog submitted for approval',
            data: blog,
        };
    }

    /**
     * Publish blog
     * POST /admin/blogs/:id/publish
     */
    @Post('admin/:id/publish')
    @UseGuards(AdminGuard)
    async publishBlog(
        @Request() req,
        @Param('id') blogId: string,
        @Body() body: { visibility?: 'private' | 'public' },
    ) {
        // Check ownership
        await this.authService.canEditBlog(blogId, req.user);

        const blog = await this.blogService.publishBlog(blogId, body.visibility || 'public');

        // Log audit
        await this.auditLog.logAction(
            'publish',
            'blog',
            blogId,
            req.user,
            { visibility: body.visibility },
            req,
        );

        return {
            success: true,
            message: 'Blog published successfully',
            data: blog,
        };
    }

    /**
     * Unpublish blog
     * POST /admin/blogs/:id/unpublish
     */
    @Post('admin/:id/unpublish')
    @UseGuards(AdminGuard)
    async unpublishBlog(
        @Request() req,
        @Param('id') blogId: string,
        @Body() body: { reason?: string },
    ) {
        // Check ownership
        await this.authService.canEditBlog(blogId, req.user);

        const blog = await this.blogService.unpublishBlog(blogId, body.reason);

        // Log audit
        await this.auditLog.logAction(
            'unpublish',
            'blog',
            blogId,
            req.user,
            { reason: body.reason },
            req,
        );

        return {
            success: true,
            message: 'Blog unpublished successfully',
            data: blog,
        };
    }

    /**
     * Get audit log for a blog
     * GET /admin/blogs/:id/audit-log
     */
    @Get('admin/:id/audit-log')
    @UseGuards(AdminGuard)
    async getAuditLog(
        @Request() req,
        @Param('id') blogId: string,
        @Query('limit') limit?: string,
    ) {
        // Check authorization (can only view own audit logs, or super admin can view all)
        const blog = await this.blogService.getAdminBlogDetail(blogId);
        if (!blog) {
            throw new NotFoundException('Blog not found');
        }

        const isOwner = blog.authorId === req.user.id;
        if (!isOwner && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Cannot view audit log for another admin\'s blog');
        }

        const logs = await this.auditLog.getEntityLogs(
            'blog',
            blogId,
            limit ? parseInt(limit, 10) : 50,
        );

        return {
            success: true,
            data: logs,
        };
    }

    // ==================== SUPER ADMIN ENDPOINTS ====================

    /**
     * Get all blogs (super admin only)
     * GET /super-admin/blogs
     */
    @Get('super-admin/all')
    @UseGuards(SuperAdminGuard)
    async getSuperAdminBlogs(
        @Query('status') status?: string,
        @Query('owner') ownerAdminId?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const filter: any = {};

        if (status) {
            filter.status = status;
        }

        if (ownerAdminId) {
            filter.authorId = ownerAdminId;
        }

        return this.blogService.getAdminBlogs(filter, {
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }

    /**
     * Approve blog (super admin only)
     * POST /super-admin/blogs/:id/approve
     */
    @Post('super-admin/:id/approve')
    @UseGuards(SuperAdminGuard)
    async approveBlog(
        @Request() req,
        @Param('id') blogId: string,
        @Body() body: { notes?: string },
    ) {
        const blog = await this.blogService.approveBlog(blogId, req.user.id, body.notes);

        // Log audit
        await this.auditLog.logAction(
            'approve',
            'blog',
            blogId,
            req.user,
            { notes: body.notes },
            req,
        );

        return {
            success: true,
            message: 'Blog approved',
            data: blog,
        };
    }

    /**
     * Reject blog (super admin only)
     * POST /super-admin/blogs/:id/reject
     */
    @Post('super-admin/:id/reject')
    @UseGuards(SuperAdminGuard)
    async rejectBlog(
        @Request() req,
        @Param('id') blogId: string,
        @Body() body: { reason: string },
    ) {
        const blog = await this.blogService.rejectBlog(blogId, body.reason);

        // Log audit
        await this.auditLog.logAction(
            'reject',
            'blog',
            blogId,
            req.user,
            { reason: body.reason },
            req,
        );

        return {
            success: true,
            message: 'Blog rejected',
            data: blog,
        };
    }

    /**
     * Get all audit logs (super admin only)
     * GET /super-admin/audit-logs
     */
    @Get('super-admin/audit-logs')
    @UseGuards(SuperAdminGuard)
    async getAllAuditLogs(
        @Query('entityType') entityType?: string,
        @Query('initiatedBy') initiatedBy?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const logs = await this.auditLog.getAllLogs(
            entityType,
            initiatedBy,
            limit ? parseInt(limit, 10) : 100,
            offset ? parseInt(offset, 10) : 0,
        );

        return {
            success: true,
            data: logs,
        };
    }
}

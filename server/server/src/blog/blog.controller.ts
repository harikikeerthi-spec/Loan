import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { BlogService } from './blog.service';

@Controller('blogs')
export class BlogController {
    constructor(private blogService: BlogService) { }

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
     * Create a new blog post
     * POST /blogs
     * @body title, slug, excerpt, content, category, authorName, authorImage?, 
     *       authorRole?, featuredImage?, readTime?, isFeatured?, isPublished?
     * @returns { success: boolean, message: string, data: Blog }
     */
    @Post()
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
    ) {
        return this.blogService.createBlog(body);
    }

    /**
     * Update a blog post
     * PUT /blogs/:id
     * @param id - Blog ID
     * @body Any blog fields to update
     * @returns { success: boolean, message: string, data: Blog }
     */
    @Put(':id')
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
     * Delete a blog post
     * DELETE /blogs/:id
     * @param id - Blog ID
     * @returns { success: boolean, message: string }
     */
    @Delete(':id')
    async deleteBlog(@Param('id') id: string) {
        return this.blogService.deleteBlog(id);
    }
}

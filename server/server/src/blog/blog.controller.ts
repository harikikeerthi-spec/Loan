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
  constructor(private blogService: BlogService) {}

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
      featured:
        featured === 'true' ? true : featured === 'false' ? false : undefined,
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
  async searchBlogs(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.blogService.searchBlogs(
      query || '',
      limit ? parseInt(limit, 10) : 10,
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
  /**
   * Add a comment to a blog
   * POST /blogs/:id/comments
   * @param id - Blog ID
   * @body content, authorName
   */
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() body: { content: string; authorName: string },
  ) {
    return this.blogService.addComment(id, body);
  }

  /**
   * Delete a comment
   * DELETE /blogs/comments/:id
   */
  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string) {
    return this.blogService.deleteComment(id);
  }

  /**
   * Toggle like on a comment
   * POST /blogs/comments/:id/like
   */
  @Post('comments/:id/like')
  async toggleCommentLike(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.blogService.toggleCommentLike(id, body.userId);
  }

  /**
   * Add a reply to a comment
   * POST /blogs/comments/:id/replies
   */
  @Post('comments/:id/replies')
  async addReply(
    @Param('id') id: string,
    @Body() body: { content: string; authorName: string },
  ) {
    return this.blogService.addReply(id, body);
  }
}

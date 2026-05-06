"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogController = void 0;
var common_1 = require("@nestjs/common");
var admin_guard_1 = require("../auth/admin.guard");
var staff_guard_1 = require("../auth/staff.guard");
var BlogController = function () {
    var _classDecorators = [(0, common_1.Controller)('blogs')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getAllAuditLogs_decorators;
    var _getBlogStatistics_decorators;
    var _getAllBlogs_decorators;
    var _getFeaturedBlog_decorators;
    var _getCategories_decorators;
    var _searchBlogs_decorators;
    var _getAllTags_decorators;
    var _searchBlogsByTag_decorators;
    var _getRelatedBlogs_decorators;
    var _getBlogBySlug_decorators;
    var _getPopularBlogs_decorators;
    var _getCommentsForBlog_decorators;
    var _addCommentToBlog_decorators;
    var _addReplyToComment_decorators;
    var _deleteComment_decorators;
    var _toggleCommentLike_decorators;
    var _getBlogStats_decorators;
    var _incrementBlogView_decorators;
    var _getBlogById_decorators;
    var _getAllBlogsAdmin_decorators;
    var _createBlog_decorators;
    var _updateBlog_decorators;
    var _deleteBlog_decorators;
    var _bulkDeleteBlogs_decorators;
    var _bulkUpdateStatus_decorators;
    var _getAdminBlogs_decorators;
    var _getAdminBlogDetail_decorators;
    var _updateAdminBlog_decorators;
    var _deleteAdminBlog_decorators;
    var _submitForApproval_decorators;
    var _publishBlog_decorators;
    var _unpublishBlog_decorators;
    var _getAuditLog_decorators;
    var _getSuperAdminBlogs_decorators;
    var _approveBlog_decorators;
    var _rejectBlog_decorators;
    var BlogController = _classThis = /** @class */ (function () {
        function BlogController_1(blogService, authService, auditLog) {
            this.blogService = (__runInitializers(this, _instanceExtraInitializers), blogService);
            this.authService = authService;
            this.auditLog = auditLog;
        }
        // ==================== ADMIN ENDPOINTS (High Priority) ====================
        /**
         * Get all audit logs (Admin Hub)
         * GET /blogs/admin/matrix-logs
         */
        BlogController_1.prototype.getAllAuditLogs = function (entityType, initiatedBy, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                var logs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.auditLog.getAllLogs(entityType, initiatedBy, limit ? parseInt(limit, 10) : 100, offset ? parseInt(offset, 10) : 0)];
                        case 1:
                            logs = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: logs,
                                }];
                    }
                });
            });
        };
        /**
         * Get blog statistics - ADMIN ONLY
         * GET /blogs/admin/stats
         * @returns { success: boolean, data: { total, published, draft, featured } }
         */
        BlogController_1.prototype.getBlogStatistics = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getBlogStatistics()];
                });
            });
        };
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
        BlogController_1.prototype.getAllBlogs = function (category, featured, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getAllBlogs({
                            category: category,
                            featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
                            limit: limit ? parseInt(limit, 10) : 10,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get featured blog for hero section
         * GET /blogs/featured
         * @returns { success: boolean, data: Blog }
         */
        BlogController_1.prototype.getFeaturedBlog = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getFeaturedBlog()];
                });
            });
        };
        /**
         * Get all blog categories with count
         * GET /blogs/categories
         * @returns { success: boolean, data: { name: string, count: number }[] }
         */
        BlogController_1.prototype.getCategories = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getCategories()];
                });
            });
        };
        /**
         * Search blogs by title, excerpt, or content
         * GET /blogs/search
         * @query q - Search query (required)
         * @query limit - Number of results (default: 10)
         * @returns { success: boolean, data: Blog[], count: number }
         */
        BlogController_1.prototype.searchBlogs = function (query, limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.searchBlogs(query || '', limit ? parseInt(limit, 10) : 10)];
                });
            });
        };
        /**
         * Get all tags with count
         * GET /blogs/tags
         * @query limit - Number of tags to return (optional)
         * @returns { success: boolean, data: { name: string, count: number, slug: string }[] }
         */
        BlogController_1.prototype.getAllTags = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getAllTags(limit ? parseInt(limit, 10) : undefined)];
                });
            });
        };
        /**
         * Search blogs by tag (supports #tag syntax)
         * GET /blogs/tags/:tag
         * @param tag - Tag name or #tag value
         * @query limit - Number of results (default: 10)
         * @query offset - Number of results to skip (default: 0)
         */
        BlogController_1.prototype.searchBlogsByTag = function (tag, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.searchBlogsByTag(tag, limit ? parseInt(limit, 10) : 10, offset ? parseInt(offset, 10) : 0)];
                });
            });
        };
        /**
         * Get related blogs by category
         * GET /blogs/related/:category
         * @param category - Category name
         * @query exclude - Slug to exclude (optional)
         * @query limit - Number of results (default: 3)
         * @returns { success: boolean, data: Blog[] }
         */
        BlogController_1.prototype.getRelatedBlogs = function (category, excludeSlug, limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getRelatedBlogs(category, excludeSlug || '', limit ? parseInt(limit, 10) : 3)];
                });
            });
        };
        /**
         * Get single blog by slug (for blog detail page)
         * GET /blogs/slug/:slug
         * @param slug - Blog slug
         * @returns { success: boolean, data: Blog (with full content) }
         */
        BlogController_1.prototype.getBlogBySlug = function (slug) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getBlogBySlug(slug)];
                });
            });
        };
        /**
         * Get most popular blogs (by view count)
         * GET /blogs/popular
         * @query limit - Number of blogs to return (default: 10)
         * @returns { success: boolean, data: Blog[] }
         */
        BlogController_1.prototype.getPopularBlogs = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getPopularBlogs(limit ? parseInt(limit, 10) : 10)];
                });
            });
        };
        /**
         * Get comments for a blog post
         * GET /blogs/:id/comments
         * @param id - Blog ID
         * @query limit - Number of comments to return (default: 20)
         * @query offset - Number of comments to skip (default: 0)
         */
        BlogController_1.prototype.getCommentsForBlog = function (id, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getCommentsForBlog(id, limit ? parseInt(limit, 10) : 20, offset ? parseInt(offset, 10) : 0)];
                });
            });
        };
        /**
         * Add a comment to a blog post
         * POST /blogs/:id/comments
         * @param id - Blog ID
         * @body author, content
         */
        BlogController_1.prototype.addCommentToBlog = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.addCommentToBlog(id, body)];
                });
            });
        };
        /**
         * Add a reply to a comment
         * POST /blogs/comments/:commentId/replies
         * @param commentId - Comment ID
         * @body author, content
         */
        BlogController_1.prototype.addReplyToComment = function (commentId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.addReplyToComment(commentId, body)];
                });
            });
        };
        /**
         * Delete a comment
         * DELETE /blogs/comments/:commentId
         */
        BlogController_1.prototype.deleteComment = function (commentId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.deleteComment(commentId)];
                });
            });
        };
        /**
         * Like or unlike a comment
         * POST /blogs/comments/:commentId/like
         * @param commentId - Comment ID
         * @body userId - User identifier (IP address for anonymous users)
         */
        BlogController_1.prototype.toggleCommentLike = function (commentId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.toggleCommentLike(commentId, body.userId)];
                });
            });
        };
        /**
         * Get blog statistics
         * GET /blogs/:id/stats
         * @param id - Blog ID
         * @returns { success: boolean, data: { views, publishedAt, createdAt, category } }
         */
        BlogController_1.prototype.getBlogStats = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getBlogStats(id)];
                });
            });
        };
        /**
         * Increment blog view count (for manual tracking)
         * POST /blogs/:id/view
         * @param id - Blog ID
         * @returns { success: boolean, views: number }
         */
        BlogController_1.prototype.incrementBlogView = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.incrementBlogView(id)];
                });
            });
        };
        /**
         * Get single blog by ID
         * GET /blogs/:id
         * @param id - Blog ID
         * @returns { success: boolean, data: Blog }
         */
        BlogController_1.prototype.getBlogById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getBlogById(id)];
                });
            });
        };
        // ==================== ADMIN ENDPOINTS ====================
        /**
         * Get all blogs (including unpublished) - ADMIN ONLY
         * GET /blogs/admin/all
         * @query limit - Number of blogs (default: 50)
         * @query offset - Skip blogs (default: 0)
         * @returns { success: boolean, data: Blog[], pagination }
         */
        BlogController_1.prototype.getAllBlogsAdmin = function (limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.getAllBlogsAdmin({
                            limit: limit ? parseInt(limit, 10) : 50,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Create a new blog post - ADMIN ONLY
         * POST /blogs
         * @body title, slug, excerpt, content, category, authorName, authorImage?,
         *       authorRole?, featuredImage?, readTime?, isFeatured?, isPublished?
         * @returns { success: boolean, message: string, data: Blog }
         */
        BlogController_1.prototype.createBlog = function (body, req) {
            return __awaiter(this, void 0, void 0, function () {
                var blogData;
                var _a;
                return __generator(this, function (_b) {
                    blogData = __assign({}, body);
                    // Only add authorId if we have an authenticated user or explicit authorId in body
                    if (body.authorId) {
                        blogData.authorId = body.authorId;
                    }
                    else if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) {
                        blogData.authorId = req.user.id;
                    }
                    // Otherwise, authorId will be undefined and stored as NULL (which is allowed)
                    return [2 /*return*/, this.blogService.createBlog(blogData)];
                });
            });
        };
        /**
         * Update a blog post - ADMIN ONLY
         * PUT /blogs/:id
         * @param id - Blog ID
         * @body Any blog fields to update
         * @returns { success: boolean, message: string, data: Blog }
         */
        BlogController_1.prototype.updateBlog = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.updateBlog(id, body)];
                });
            });
        };
        /**
         * Delete a blog post - ADMIN ONLY
         * DELETE /blogs/:id
         * @param id - Blog ID
         * @returns { success: boolean, message: string }
         */
        BlogController_1.prototype.deleteBlog = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.deleteBlog(id)];
                });
            });
        };
        /**
         * Bulk delete blogs - ADMIN ONLY
         * POST /blogs/admin/bulk-delete
         * @body blogIds - Array of blog IDs to delete
         * @returns { success: boolean, message: string, deleted: number }
         */
        BlogController_1.prototype.bulkDeleteBlogs = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.bulkDeleteBlogs(body.blogIds)];
                });
            });
        };
        /**
         * Bulk update blog status - ADMIN ONLY
         * POST /blogs/admin/bulk-status
         * @body blogIds, isPublished
         * @returns { success: boolean, message: string, updated: number }
         */
        BlogController_1.prototype.bulkUpdateStatus = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.bulkUpdateStatus(body.blogIds, body.isPublished)];
                });
            });
        };
        // ==================== NEW ADMIN ENDPOINTS (WITH AUTHORIZATION) ====================
        /**
         * Get admin blogs with scope filtering (My Blogs, Other Admin Blogs)
         * GET /admin/blogs
         * @query scope - 'own' | 'other' | 'all' (default: 'all')
         * @query status - Filter by status (draft, pending, published)
         * @query limit - Number of blogs (default: 20)
         * @query offset - Skip blogs (default: 0)
         */
        BlogController_1.prototype.getAdminBlogs = function (req_1) {
            return __awaiter(this, arguments, void 0, function (req, scope, status, limit, offset) {
                var filter;
                if (scope === void 0) { scope = 'all'; }
                return __generator(this, function (_a) {
                    filter = this.authService.getVisibilityFilter(req.user, scope);
                    if (status) {
                        filter.status = status;
                    }
                    return [2 /*return*/, this.blogService.getAdminBlogs(filter, {
                            limit: limit ? parseInt(limit, 10) : 20,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get blog detail for admin (with full metadata)
         * GET /admin/blogs/:id
         */
        BlogController_1.prototype.getAdminBlogDetail = function (req, blogId) {
            return __awaiter(this, void 0, void 0, function () {
                var canView, blog, isOwner;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.authService.canViewBlog(blogId, req.user)];
                        case 1:
                            canView = _a.sent();
                            if (!canView) {
                                throw new common_1.ForbiddenException('Cannot access this blog');
                            }
                            return [4 /*yield*/, this.blogService.getAdminBlogDetail(blogId)];
                        case 2:
                            blog = _a.sent();
                            if (!blog) {
                                throw new common_1.NotFoundException('Blog not found');
                            }
                            isOwner = blog.authorId === req.user.id;
                            blog['readOnly'] = !isOwner && req.user.role !== 'super_admin';
                            blog['isOwnContent'] = isOwner;
                            return [2 /*return*/, {
                                    success: true,
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Update blog (with authorization)
         * PUT /admin/blogs/:id
         */
        BlogController_1.prototype.updateAdminBlog = function (req, blogId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var originalBlog, updatedBlog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Check ownership
                        return [4 /*yield*/, this.authService.canEditBlog(blogId, req.user)];
                        case 1:
                            // Check ownership
                            _a.sent();
                            return [4 /*yield*/, this.blogService.getAdminBlogDetail(blogId)];
                        case 2:
                            originalBlog = _a.sent();
                            return [4 /*yield*/, this.blogService.updateBlog(blogId, body)];
                        case 3:
                            updatedBlog = _a.sent();
                            // Log audit
                            return [4 /*yield*/, this.auditLog.logAction('update', 'blog', blogId, req.user, {
                                    before: originalBlog,
                                    after: updatedBlog,
                                }, req)];
                        case 4:
                            // Log audit
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: updatedBlog,
                                }];
                    }
                });
            });
        };
        /**
         * Delete blog (with authorization)
         * DELETE /admin/blogs/:id
         */
        BlogController_1.prototype.deleteAdminBlog = function (req, blogId) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Check ownership
                        return [4 /*yield*/, this.authService.canDeleteBlog(blogId, req.user)];
                        case 1:
                            // Check ownership
                            _a.sent();
                            return [4 /*yield*/, this.blogService.getAdminBlogDetail(blogId)];
                        case 2:
                            blog = _a.sent();
                            return [4 /*yield*/, this.blogService.deleteBlog(blogId)];
                        case 3:
                            _a.sent();
                            // Log audit
                            return [4 /*yield*/, this.auditLog.logAction('delete', 'blog', blogId, req.user, { deletedBlog: blog }, req)];
                        case 4:
                            // Log audit
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Blog deleted successfully',
                                }];
                    }
                });
            });
        };
        /**
         * Submit blog for approval
         * POST /admin/blogs/:id/submit-for-approval
         */
        BlogController_1.prototype.submitForApproval = function (req, blogId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Check ownership
                        return [4 /*yield*/, this.authService.canEditBlog(blogId, req.user)];
                        case 1:
                            // Check ownership
                            _a.sent();
                            return [4 /*yield*/, this.blogService.submitForApproval(blogId, body.notes)];
                        case 2:
                            blog = _a.sent();
                            // Log audit
                            return [4 /*yield*/, this.auditLog.logAction('submit_for_approval', 'blog', blogId, req.user, { notes: body.notes }, req)];
                        case 3:
                            // Log audit
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Blog submitted for approval',
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Publish blog
         * POST /admin/blogs/:id/publish
         */
        BlogController_1.prototype.publishBlog = function (req, blogId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Check ownership
                        return [4 /*yield*/, this.authService.canEditBlog(blogId, req.user)];
                        case 1:
                            // Check ownership
                            _a.sent();
                            return [4 /*yield*/, this.blogService.publishBlog(blogId, body.visibility || 'public')];
                        case 2:
                            blog = _a.sent();
                            // Log audit
                            return [4 /*yield*/, this.auditLog.logAction('publish', 'blog', blogId, req.user, { visibility: body.visibility }, req)];
                        case 3:
                            // Log audit
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Blog published successfully',
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Unpublish blog
         * POST /admin/blogs/:id/unpublish
         */
        BlogController_1.prototype.unpublishBlog = function (req, blogId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Check ownership
                        return [4 /*yield*/, this.authService.canEditBlog(blogId, req.user)];
                        case 1:
                            // Check ownership
                            _a.sent();
                            return [4 /*yield*/, this.blogService.unpublishBlog(blogId, body.reason)];
                        case 2:
                            blog = _a.sent();
                            // Log audit
                            return [4 /*yield*/, this.auditLog.logAction('unpublish', 'blog', blogId, req.user, { reason: body.reason }, req)];
                        case 3:
                            // Log audit
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Blog unpublished successfully',
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Get audit log for a blog
         * GET /admin/blogs/:id/audit-log
         */
        BlogController_1.prototype.getAuditLog = function (req, blogId, limit) {
            return __awaiter(this, void 0, void 0, function () {
                var blog, isOwner, logs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.blogService.getAdminBlogDetail(blogId)];
                        case 1:
                            blog = _a.sent();
                            if (!blog) {
                                throw new common_1.NotFoundException('Blog not found');
                            }
                            isOwner = blog.authorId === req.user.id;
                            if (!isOwner && req.user.role !== 'super_admin') {
                                throw new common_1.ForbiddenException('Cannot view audit log for another admin\'s blog');
                            }
                            return [4 /*yield*/, this.auditLog.getEntityLogs('blog', blogId, limit ? parseInt(limit, 10) : 50)];
                        case 2:
                            logs = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: logs,
                                }];
                    }
                });
            });
        };
        // ==================== SUPER ADMIN ENDPOINTS ====================
        /**
         * Get all blogs (super admin only)
         * GET /super-admin/blogs
         */
        BlogController_1.prototype.getSuperAdminBlogs = function (status, ownerAdminId, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                var filter;
                return __generator(this, function (_a) {
                    filter = {};
                    if (status) {
                        filter.status = status;
                    }
                    if (ownerAdminId) {
                        filter.authorId = ownerAdminId;
                    }
                    return [2 /*return*/, this.blogService.getAdminBlogs(filter, {
                            limit: limit ? parseInt(limit, 10) : 50,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Approve blog (super admin only)
         * POST /super-admin/blogs/:id/approve
         */
        BlogController_1.prototype.approveBlog = function (req, blogId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.blogService.approveBlog(blogId, req.user.id, body.notes)];
                        case 1:
                            blog = _a.sent();
                            // Log audit
                            return [4 /*yield*/, this.auditLog.logAction('approve', 'blog', blogId, req.user, { notes: body.notes }, req)];
                        case 2:
                            // Log audit
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Blog approved',
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Reject blog (super admin only)
         * POST /super-admin/blogs/:id/reject
         */
        BlogController_1.prototype.rejectBlog = function (req, blogId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.blogService.rejectBlog(blogId, body.reason)];
                        case 1:
                            blog = _a.sent();
                            // Log audit
                            return [4 /*yield*/, this.auditLog.logAction('reject', 'blog', blogId, req.user, { reason: body.reason }, req)];
                        case 2:
                            // Log audit
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Blog rejected',
                                    data: blog,
                                }];
                    }
                });
            });
        };
        return BlogController_1;
    }());
    __setFunctionName(_classThis, "BlogController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getAllAuditLogs_decorators = [(0, common_1.Get)('admin/matrix-logs'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getBlogStatistics_decorators = [(0, common_1.Get)('admin/stats'), (0, common_1.UseGuards)(staff_guard_1.StaffGuard)];
        _getAllBlogs_decorators = [(0, common_1.Get)()];
        _getFeaturedBlog_decorators = [(0, common_1.Get)('featured')];
        _getCategories_decorators = [(0, common_1.Get)('categories')];
        _searchBlogs_decorators = [(0, common_1.Get)('search')];
        _getAllTags_decorators = [(0, common_1.Get)('tags')];
        _searchBlogsByTag_decorators = [(0, common_1.Get)('tags/:tag')];
        _getRelatedBlogs_decorators = [(0, common_1.Get)('related/:category')];
        _getBlogBySlug_decorators = [(0, common_1.Get)('slug/:slug')];
        _getPopularBlogs_decorators = [(0, common_1.Get)('popular')];
        _getCommentsForBlog_decorators = [(0, common_1.Get)(':id/comments')];
        _addCommentToBlog_decorators = [(0, common_1.Post)(':id/comments')];
        _addReplyToComment_decorators = [(0, common_1.Post)('comments/:commentId/replies')];
        _deleteComment_decorators = [(0, common_1.Delete)('comments/:commentId')];
        _toggleCommentLike_decorators = [(0, common_1.Post)('comments/:commentId/like')];
        _getBlogStats_decorators = [(0, common_1.Get)(':id/stats')];
        _incrementBlogView_decorators = [(0, common_1.Post)(':id/view')];
        _getBlogById_decorators = [(0, common_1.Get)(':id')];
        _getAllBlogsAdmin_decorators = [(0, common_1.Get)('admin/all'), (0, common_1.UseGuards)(staff_guard_1.StaffGuard)];
        _createBlog_decorators = [(0, common_1.Post)(), (0, common_1.UseGuards)(staff_guard_1.StaffGuard)];
        _updateBlog_decorators = [(0, common_1.Put)(':id'), (0, common_1.UseGuards)(staff_guard_1.StaffGuard)];
        _deleteBlog_decorators = [(0, common_1.Delete)(':id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _bulkDeleteBlogs_decorators = [(0, common_1.Post)('admin/bulk-delete'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _bulkUpdateStatus_decorators = [(0, common_1.Post)('admin/bulk-status'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getAdminBlogs_decorators = [(0, common_1.Get)('admin/list'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getAdminBlogDetail_decorators = [(0, common_1.Get)('admin/:id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _updateAdminBlog_decorators = [(0, common_1.Put)('admin/:id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _deleteAdminBlog_decorators = [(0, common_1.Delete)('admin/:id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _submitForApproval_decorators = [(0, common_1.Post)('admin/:id/submit-for-approval'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _publishBlog_decorators = [(0, common_1.Post)('admin/:id/publish'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _unpublishBlog_decorators = [(0, common_1.Post)('admin/:id/unpublish'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getAuditLog_decorators = [(0, common_1.Get)('admin/:id/audit-log'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getSuperAdminBlogs_decorators = [(0, common_1.Get)('super-admin/all'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _approveBlog_decorators = [(0, common_1.Post)('super-admin/:id/approve'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _rejectBlog_decorators = [(0, common_1.Post)('super-admin/:id/reject'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        __esDecorate(_classThis, null, _getAllAuditLogs_decorators, { kind: "method", name: "getAllAuditLogs", static: false, private: false, access: { has: function (obj) { return "getAllAuditLogs" in obj; }, get: function (obj) { return obj.getAllAuditLogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBlogStatistics_decorators, { kind: "method", name: "getBlogStatistics", static: false, private: false, access: { has: function (obj) { return "getBlogStatistics" in obj; }, get: function (obj) { return obj.getBlogStatistics; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllBlogs_decorators, { kind: "method", name: "getAllBlogs", static: false, private: false, access: { has: function (obj) { return "getAllBlogs" in obj; }, get: function (obj) { return obj.getAllBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFeaturedBlog_decorators, { kind: "method", name: "getFeaturedBlog", static: false, private: false, access: { has: function (obj) { return "getFeaturedBlog" in obj; }, get: function (obj) { return obj.getFeaturedBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCategories_decorators, { kind: "method", name: "getCategories", static: false, private: false, access: { has: function (obj) { return "getCategories" in obj; }, get: function (obj) { return obj.getCategories; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _searchBlogs_decorators, { kind: "method", name: "searchBlogs", static: false, private: false, access: { has: function (obj) { return "searchBlogs" in obj; }, get: function (obj) { return obj.searchBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllTags_decorators, { kind: "method", name: "getAllTags", static: false, private: false, access: { has: function (obj) { return "getAllTags" in obj; }, get: function (obj) { return obj.getAllTags; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _searchBlogsByTag_decorators, { kind: "method", name: "searchBlogsByTag", static: false, private: false, access: { has: function (obj) { return "searchBlogsByTag" in obj; }, get: function (obj) { return obj.searchBlogsByTag; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRelatedBlogs_decorators, { kind: "method", name: "getRelatedBlogs", static: false, private: false, access: { has: function (obj) { return "getRelatedBlogs" in obj; }, get: function (obj) { return obj.getRelatedBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBlogBySlug_decorators, { kind: "method", name: "getBlogBySlug", static: false, private: false, access: { has: function (obj) { return "getBlogBySlug" in obj; }, get: function (obj) { return obj.getBlogBySlug; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPopularBlogs_decorators, { kind: "method", name: "getPopularBlogs", static: false, private: false, access: { has: function (obj) { return "getPopularBlogs" in obj; }, get: function (obj) { return obj.getPopularBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCommentsForBlog_decorators, { kind: "method", name: "getCommentsForBlog", static: false, private: false, access: { has: function (obj) { return "getCommentsForBlog" in obj; }, get: function (obj) { return obj.getCommentsForBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addCommentToBlog_decorators, { kind: "method", name: "addCommentToBlog", static: false, private: false, access: { has: function (obj) { return "addCommentToBlog" in obj; }, get: function (obj) { return obj.addCommentToBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addReplyToComment_decorators, { kind: "method", name: "addReplyToComment", static: false, private: false, access: { has: function (obj) { return "addReplyToComment" in obj; }, get: function (obj) { return obj.addReplyToComment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteComment_decorators, { kind: "method", name: "deleteComment", static: false, private: false, access: { has: function (obj) { return "deleteComment" in obj; }, get: function (obj) { return obj.deleteComment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _toggleCommentLike_decorators, { kind: "method", name: "toggleCommentLike", static: false, private: false, access: { has: function (obj) { return "toggleCommentLike" in obj; }, get: function (obj) { return obj.toggleCommentLike; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBlogStats_decorators, { kind: "method", name: "getBlogStats", static: false, private: false, access: { has: function (obj) { return "getBlogStats" in obj; }, get: function (obj) { return obj.getBlogStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _incrementBlogView_decorators, { kind: "method", name: "incrementBlogView", static: false, private: false, access: { has: function (obj) { return "incrementBlogView" in obj; }, get: function (obj) { return obj.incrementBlogView; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBlogById_decorators, { kind: "method", name: "getBlogById", static: false, private: false, access: { has: function (obj) { return "getBlogById" in obj; }, get: function (obj) { return obj.getBlogById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllBlogsAdmin_decorators, { kind: "method", name: "getAllBlogsAdmin", static: false, private: false, access: { has: function (obj) { return "getAllBlogsAdmin" in obj; }, get: function (obj) { return obj.getAllBlogsAdmin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createBlog_decorators, { kind: "method", name: "createBlog", static: false, private: false, access: { has: function (obj) { return "createBlog" in obj; }, get: function (obj) { return obj.createBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateBlog_decorators, { kind: "method", name: "updateBlog", static: false, private: false, access: { has: function (obj) { return "updateBlog" in obj; }, get: function (obj) { return obj.updateBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteBlog_decorators, { kind: "method", name: "deleteBlog", static: false, private: false, access: { has: function (obj) { return "deleteBlog" in obj; }, get: function (obj) { return obj.deleteBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkDeleteBlogs_decorators, { kind: "method", name: "bulkDeleteBlogs", static: false, private: false, access: { has: function (obj) { return "bulkDeleteBlogs" in obj; }, get: function (obj) { return obj.bulkDeleteBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkUpdateStatus_decorators, { kind: "method", name: "bulkUpdateStatus", static: false, private: false, access: { has: function (obj) { return "bulkUpdateStatus" in obj; }, get: function (obj) { return obj.bulkUpdateStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminBlogs_decorators, { kind: "method", name: "getAdminBlogs", static: false, private: false, access: { has: function (obj) { return "getAdminBlogs" in obj; }, get: function (obj) { return obj.getAdminBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminBlogDetail_decorators, { kind: "method", name: "getAdminBlogDetail", static: false, private: false, access: { has: function (obj) { return "getAdminBlogDetail" in obj; }, get: function (obj) { return obj.getAdminBlogDetail; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateAdminBlog_decorators, { kind: "method", name: "updateAdminBlog", static: false, private: false, access: { has: function (obj) { return "updateAdminBlog" in obj; }, get: function (obj) { return obj.updateAdminBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteAdminBlog_decorators, { kind: "method", name: "deleteAdminBlog", static: false, private: false, access: { has: function (obj) { return "deleteAdminBlog" in obj; }, get: function (obj) { return obj.deleteAdminBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitForApproval_decorators, { kind: "method", name: "submitForApproval", static: false, private: false, access: { has: function (obj) { return "submitForApproval" in obj; }, get: function (obj) { return obj.submitForApproval; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _publishBlog_decorators, { kind: "method", name: "publishBlog", static: false, private: false, access: { has: function (obj) { return "publishBlog" in obj; }, get: function (obj) { return obj.publishBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _unpublishBlog_decorators, { kind: "method", name: "unpublishBlog", static: false, private: false, access: { has: function (obj) { return "unpublishBlog" in obj; }, get: function (obj) { return obj.unpublishBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAuditLog_decorators, { kind: "method", name: "getAuditLog", static: false, private: false, access: { has: function (obj) { return "getAuditLog" in obj; }, get: function (obj) { return obj.getAuditLog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSuperAdminBlogs_decorators, { kind: "method", name: "getSuperAdminBlogs", static: false, private: false, access: { has: function (obj) { return "getSuperAdminBlogs" in obj; }, get: function (obj) { return obj.getSuperAdminBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approveBlog_decorators, { kind: "method", name: "approveBlog", static: false, private: false, access: { has: function (obj) { return "approveBlog" in obj; }, get: function (obj) { return obj.approveBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _rejectBlog_decorators, { kind: "method", name: "rejectBlog", static: false, private: false, access: { has: function (obj) { return "rejectBlog" in obj; }, get: function (obj) { return obj.rejectBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BlogController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BlogController = _classThis;
}();
exports.BlogController = BlogController;

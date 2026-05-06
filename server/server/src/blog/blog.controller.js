"use strict";
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
var BlogController = function () {
    var _classDecorators = [(0, common_1.Controller)('blogs')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getAllBlogs_decorators;
    var _getFeaturedBlog_decorators;
    var _getCategories_decorators;
    var _searchBlogs_decorators;
    var _getRelatedBlogs_decorators;
    var _getBlogBySlug_decorators;
    var _getBlogById_decorators;
    var _createBlog_decorators;
    var _updateBlog_decorators;
    var _deleteBlog_decorators;
    var _addComment_decorators;
    var _deleteComment_decorators;
    var _toggleCommentLike_decorators;
    var _addReply_decorators;
    var BlogController = _classThis = /** @class */ (function () {
        function BlogController_1(blogService) {
            this.blogService = (__runInitializers(this, _instanceExtraInitializers), blogService);
        }
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
         * Create a new blog post
         * POST /blogs
         * @body title, slug, excerpt, content, category, authorName, authorImage?,
         *       authorRole?, featuredImage?, readTime?, isFeatured?, isPublished?
         * @returns { success: boolean, message: string, data: Blog }
         */
        BlogController_1.prototype.createBlog = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.createBlog(body)];
                });
            });
        };
        /**
         * Update a blog post
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
         * Delete a blog post
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
         * Add a comment to a blog
         * POST /blogs/:id/comments
         * @param id - Blog ID
         * @body content, authorName
         */
        BlogController_1.prototype.addComment = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.addComment(id, body)];
                });
            });
        };
        /**
         * Delete a comment
         * DELETE /blogs/comments/:id
         */
        BlogController_1.prototype.deleteComment = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.deleteComment(id)];
                });
            });
        };
        /**
         * Toggle like on a comment
         * POST /blogs/comments/:id/like
         */
        BlogController_1.prototype.toggleCommentLike = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.toggleCommentLike(id, body.userId)];
                });
            });
        };
        /**
         * Add a reply to a comment
         * POST /blogs/comments/:id/replies
         */
        BlogController_1.prototype.addReply = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.blogService.addReply(id, body)];
                });
            });
        };
        return BlogController_1;
    }());
    __setFunctionName(_classThis, "BlogController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getAllBlogs_decorators = [(0, common_1.Get)()];
        _getFeaturedBlog_decorators = [(0, common_1.Get)('featured')];
        _getCategories_decorators = [(0, common_1.Get)('categories')];
        _searchBlogs_decorators = [(0, common_1.Get)('search')];
        _getRelatedBlogs_decorators = [(0, common_1.Get)('related/:category')];
        _getBlogBySlug_decorators = [(0, common_1.Get)('slug/:slug')];
        _getBlogById_decorators = [(0, common_1.Get)(':id')];
        _createBlog_decorators = [(0, common_1.Post)()];
        _updateBlog_decorators = [(0, common_1.Put)(':id')];
        _deleteBlog_decorators = [(0, common_1.Delete)(':id')];
        _addComment_decorators = [(0, common_1.Post)(':id/comments')];
        _deleteComment_decorators = [(0, common_1.Delete)('comments/:id')];
        _toggleCommentLike_decorators = [(0, common_1.Post)('comments/:id/like')];
        _addReply_decorators = [(0, common_1.Post)('comments/:id/replies')];
        __esDecorate(_classThis, null, _getAllBlogs_decorators, { kind: "method", name: "getAllBlogs", static: false, private: false, access: { has: function (obj) { return "getAllBlogs" in obj; }, get: function (obj) { return obj.getAllBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFeaturedBlog_decorators, { kind: "method", name: "getFeaturedBlog", static: false, private: false, access: { has: function (obj) { return "getFeaturedBlog" in obj; }, get: function (obj) { return obj.getFeaturedBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCategories_decorators, { kind: "method", name: "getCategories", static: false, private: false, access: { has: function (obj) { return "getCategories" in obj; }, get: function (obj) { return obj.getCategories; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _searchBlogs_decorators, { kind: "method", name: "searchBlogs", static: false, private: false, access: { has: function (obj) { return "searchBlogs" in obj; }, get: function (obj) { return obj.searchBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRelatedBlogs_decorators, { kind: "method", name: "getRelatedBlogs", static: false, private: false, access: { has: function (obj) { return "getRelatedBlogs" in obj; }, get: function (obj) { return obj.getRelatedBlogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBlogBySlug_decorators, { kind: "method", name: "getBlogBySlug", static: false, private: false, access: { has: function (obj) { return "getBlogBySlug" in obj; }, get: function (obj) { return obj.getBlogBySlug; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBlogById_decorators, { kind: "method", name: "getBlogById", static: false, private: false, access: { has: function (obj) { return "getBlogById" in obj; }, get: function (obj) { return obj.getBlogById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createBlog_decorators, { kind: "method", name: "createBlog", static: false, private: false, access: { has: function (obj) { return "createBlog" in obj; }, get: function (obj) { return obj.createBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateBlog_decorators, { kind: "method", name: "updateBlog", static: false, private: false, access: { has: function (obj) { return "updateBlog" in obj; }, get: function (obj) { return obj.updateBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteBlog_decorators, { kind: "method", name: "deleteBlog", static: false, private: false, access: { has: function (obj) { return "deleteBlog" in obj; }, get: function (obj) { return obj.deleteBlog; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addComment_decorators, { kind: "method", name: "addComment", static: false, private: false, access: { has: function (obj) { return "addComment" in obj; }, get: function (obj) { return obj.addComment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteComment_decorators, { kind: "method", name: "deleteComment", static: false, private: false, access: { has: function (obj) { return "deleteComment" in obj; }, get: function (obj) { return obj.deleteComment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _toggleCommentLike_decorators, { kind: "method", name: "toggleCommentLike", static: false, private: false, access: { has: function (obj) { return "toggleCommentLike" in obj; }, get: function (obj) { return obj.toggleCommentLike; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addReply_decorators, { kind: "method", name: "addReply", static: false, private: false, access: { has: function (obj) { return "addReply" in obj; }, get: function (obj) { return obj.addReply; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BlogController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BlogController = _classThis;
}();
exports.BlogController = BlogController;

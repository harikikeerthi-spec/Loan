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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogService = void 0;
// @ts-nocheck
var common_1 = require("@nestjs/common");
var BlogService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BlogService = _classThis = /** @class */ (function () {
        function BlogService_1(prisma) {
            this.prisma = prisma;
        }
        /**
         * Get all published blogs with basic info (title, excerpt, category, etc.)
         * Used for blog listing page
         */
        BlogService_1.prototype.getAllBlogs = function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, category, featured, _b, limit, _c, offset, where, blogs, total;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _a = options || {}, category = _a.category, featured = _a.featured, _b = _a.limit, limit = _b === void 0 ? 10 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                            where = {
                                isPublished: true,
                            };
                            if (category) {
                                where.category = category;
                            }
                            if (featured !== undefined) {
                                where.isFeatured = featured;
                            }
                            return [4 /*yield*/, this.prisma.blog.findMany({
                                    where: where,
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
                                })];
                        case 1:
                            blogs = _d.sent();
                            return [4 /*yield*/, this.prisma.blog.count({ where: where })];
                        case 2:
                            total = _d.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: blogs,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + blogs.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        /**
         * Get featured blog (for homepage/blog listing hero)
         */
        BlogService_1.prototype.getFeaturedBlog = function () {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.blog.findFirst({
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
                            })];
                        case 1:
                            blog = _a.sent();
                            if (!blog) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'No featured blog found',
                                        data: null,
                                    }];
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Get full blog by slug (for individual blog page)
         * Includes full content
         */
        BlogService_1.prototype.getBlogBySlug = function (slug) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.blog.findUnique({
                                where: { slug: slug },
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
                            })];
                        case 1:
                            blog = _a.sent();
                            if (!blog) {
                                throw new common_1.NotFoundException('Blog not found');
                            }
                            // Increment view count
                            return [4 /*yield*/, this.prisma.blog.update({
                                    where: { slug: slug },
                                    data: { views: { increment: 1 } },
                                })];
                        case 2:
                            // Increment view count
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Get blog by ID
         */
        BlogService_1.prototype.getBlogById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.blog.findUnique({
                                where: { id: id },
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
                            })];
                        case 1:
                            blog = _a.sent();
                            if (!blog) {
                                throw new common_1.NotFoundException('Blog not found');
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Get all categories with blog count
         */
        BlogService_1.prototype.getCategories = function () {
            return __awaiter(this, void 0, void 0, function () {
                var categories;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.blog.groupBy({
                                by: ['category'],
                                where: {
                                    isPublished: true,
                                },
                                _count: {
                                    category: true,
                                },
                            })];
                        case 1:
                            categories = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: categories.map(function (c) { return ({
                                        name: c.category,
                                        count: c._count.category,
                                    }); }),
                                }];
                    }
                });
            });
        };
        /**
         * Get related blogs by category (excluding current blog)
         */
        BlogService_1.prototype.getRelatedBlogs = function (category_1, excludeSlug_1) {
            return __awaiter(this, arguments, void 0, function (category, excludeSlug, limit) {
                var blogs;
                if (limit === void 0) { limit = 3; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.blog.findMany({
                                where: {
                                    isPublished: true,
                                    category: category,
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
                            })];
                        case 1:
                            blogs = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: blogs,
                                }];
                    }
                });
            });
        };
        /**
         * Create a new blog post
         */
        BlogService_1.prototype.createBlog = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var isPublished, isFeatured, rest, blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Generate slug from title if not provided
                            if (!data.slug) {
                                data.slug = data.title
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                            }
                            isPublished = data.isPublished, isFeatured = data.isFeatured, rest = __rest(data, ["isPublished", "isFeatured"]);
                            return [4 /*yield*/, this.prisma.blog.create({
                                    data: __assign(__assign({}, rest), { published: isPublished, featured: isFeatured, publishedAt: isPublished ? new Date() : null }),
                                })];
                        case 1:
                            blog = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Blog created successfully',
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Update a blog post
         */
        BlogService_1.prototype.updateBlog = function (id, data) {
            return __awaiter(this, void 0, void 0, function () {
                var existingBlog, isPublished, isFeatured, rest, updateData, blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.blog.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            existingBlog = _a.sent();
                            if (!existingBlog) {
                                throw new common_1.NotFoundException('Blog not found');
                            }
                            // Set publishedAt if publishing for the first time
                            if (data.isPublished && !existingBlog.publishedAt) {
                                data.publishedAt = new Date();
                            }
                            isPublished = data.isPublished, isFeatured = data.isFeatured, rest = __rest(data, ["isPublished", "isFeatured"]);
                            updateData = __assign({}, rest);
                            if (isPublished !== undefined)
                                updateData.isPublished = isPublished;
                            if (isFeatured !== undefined)
                                updateData.isFeatured = isFeatured;
                            return [4 /*yield*/, this.prisma.blog.update({
                                    where: { id: id },
                                    data: updateData,
                                })];
                        case 2:
                            blog = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Blog updated successfully',
                                    data: blog,
                                }];
                    }
                });
            });
        };
        /**
         * Delete a blog post
         */
        BlogService_1.prototype.deleteBlog = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.blog.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            blog = _a.sent();
                            if (!blog) {
                                throw new common_1.NotFoundException('Blog not found');
                            }
                            return [4 /*yield*/, this.prisma.blog.delete({
                                    where: { id: id },
                                })];
                        case 2:
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
         * Search blogs by title or content
         */
        BlogService_1.prototype.searchBlogs = function (query_1) {
            return __awaiter(this, arguments, void 0, function (query, limit) {
                var blogs;
                if (limit === void 0) { limit = 10; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.blog.findMany({
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
                            })];
                        case 1:
                            blogs = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: blogs,
                                    count: blogs.length,
                                }];
                    }
                });
            });
        };
        /**
         * Add a comment to a blog
         */
        BlogService_1.prototype.addComment = function (blogId, data) {
            return __awaiter(this, void 0, void 0, function () {
                var blog, comment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.blog.findUnique({
                                where: { id: blogId },
                            })];
                        case 1:
                            blog = _a.sent();
                            if (!blog) {
                                throw new common_1.NotFoundException('Blog not found');
                            }
                            return [4 /*yield*/, this.prisma.comment.create({
                                    data: {
                                        content: data.content,
                                        author: data.authorName,
                                        blogId: blogId,
                                    },
                                })];
                        case 2:
                            comment = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: comment,
                                }];
                    }
                });
            });
        };
        /**
         * Delete a comment
         */
        BlogService_1.prototype.deleteComment = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var comment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.comment.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            comment = _a.sent();
                            if (!comment) {
                                throw new common_1.NotFoundException('Comment not found');
                            }
                            return [4 /*yield*/, this.prisma.comment.delete({
                                    where: { id: id },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Comment deleted successfully',
                                }];
                    }
                });
            });
        };
        /**
         * Toggle like on a comment
         */
        BlogService_1.prototype.toggleCommentLike = function (commentId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var comment, updatedComment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.comment.findUnique({
                                where: { id: commentId },
                            })];
                        case 1:
                            comment = _a.sent();
                            if (!comment) {
                                throw new common_1.NotFoundException('Comment not found');
                            }
                            return [4 /*yield*/, this.prisma.comment.update({
                                    where: { id: commentId },
                                    data: { likes: { increment: 1 } },
                                })];
                        case 2:
                            updatedComment = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: updatedComment,
                                }];
                    }
                });
            });
        };
        /**
         * Add a reply to a comment
         */
        BlogService_1.prototype.addReply = function (commentId, data) {
            return __awaiter(this, void 0, void 0, function () {
                var parentComment, reply;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.comment.findUnique({
                                where: { id: commentId },
                            })];
                        case 1:
                            parentComment = _a.sent();
                            if (!parentComment) {
                                throw new common_1.NotFoundException('Parent comment not found');
                            }
                            return [4 /*yield*/, this.prisma.comment.create({
                                    data: {
                                        content: data.content,
                                        author: data.authorName,
                                        parentId: commentId,
                                        blogId: parentComment.blogId,
                                    },
                                })];
                        case 2:
                            reply = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: reply,
                                }];
                    }
                });
            });
        };
        return BlogService_1;
    }());
    __setFunctionName(_classThis, "BlogService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BlogService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BlogService = _classThis;
}();
exports.BlogService = BlogService;

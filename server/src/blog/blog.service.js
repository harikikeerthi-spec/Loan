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
        function BlogService_1(supabase) {
            this.supabase = supabase;
        }
        Object.defineProperty(BlogService_1.prototype, "db", {
            get: function () {
                return this.supabase.getClient();
            },
            enumerable: false,
            configurable: true
        });
        BlogService_1.prototype.normalizeTagName = function (tag) {
            return (tag || '').trim().replace(/^#/, '').toLowerCase();
        };
        BlogService_1.prototype.slugifyTag = function (tag) {
            return this.normalizeTagName(tag).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        };
        BlogService_1.prototype.upsertTags = function (tagNames) {
            return __awaiter(this, void 0, void 0, function () {
                var normalized;
                var _this = this;
                return __generator(this, function (_a) {
                    normalized = Array.from(new Set((tagNames || []).map(function (t) { return _this.normalizeTagName(t); }).filter(Boolean)));
                    if (!normalized.length)
                        return [2 /*return*/, []];
                    return [2 /*return*/, Promise.all(normalized.map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                            var existing, created;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.db.from('Tag').select('id').eq('name', name).single()];
                                    case 1:
                                        existing = (_a.sent()).data;
                                        if (existing)
                                            return [2 /*return*/, existing];
                                        return [4 /*yield*/, this.db.from('Tag').insert({ name: name, slug: this.slugifyTag(name) }).select('id').single()];
                                    case 2:
                                        created = (_a.sent()).data;
                                        return [2 /*return*/, created];
                                }
                            });
                        }); }))];
                });
            });
        };
        BlogService_1.prototype.mapTags = function (blog) {
            if (!blog)
                return blog;
            return __assign(__assign({}, blog), { tags: (blog.tags || []).map(function (t) { return (t.tag ? t.tag.name : t.name || t); }) });
        };
        BlogService_1.prototype.getAllBlogs = function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, category, featured, _b, limit, _c, offset, query, _d, blogs, count;
                var _this = this;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _a = options || {}, category = _a.category, featured = _a.featured, _b = _a.limit, limit = _b === void 0 ? 10 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                            query = this.db
                                .from('Blog')
                                .select('id, title, slug, excerpt, category, authorName, authorImage, authorRole, featuredImage, readTime, views, isFeatured, publishedAt, createdAt, tags:BlogTag(tag:Tag(name))', { count: 'exact' })
                                .eq('isPublished', true)
                                .order('isFeatured', { ascending: false })
                                .order('publishedAt', { ascending: false })
                                .range(offset, offset + limit - 1);
                            if (category)
                                query = query.eq('category', category);
                            if (featured !== undefined)
                                query = query.eq('isFeatured', featured);
                            return [4 /*yield*/, query];
                        case 1:
                            _d = _e.sent(), blogs = _d.data, count = _d.count;
                            return [2 /*return*/, {
                                    success: true,
                                    data: (blogs || []).map(function (b) { return _this.mapTags(b); }),
                                    pagination: { total: count || 0, limit: limit, offset: offset, hasMore: offset + ((blogs === null || blogs === void 0 ? void 0 : blogs.length) || 0) < (count || 0) },
                                }];
                    }
                });
            });
        };
        BlogService_1.prototype.getFeaturedBlog = function () {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .select('id, title, slug, excerpt, category, authorName, authorImage, authorRole, featuredImage, readTime, views, publishedAt, tags:BlogTag(tag:Tag(name))')
                                .eq('isPublished', true)
                                .eq('isFeatured', true)
                                .order('publishedAt', { ascending: false })
                                .limit(1)
                                .single()];
                        case 1:
                            blog = (_a.sent()).data;
                            if (!blog)
                                return [2 /*return*/, { success: false, message: 'No featured blog found', data: null }];
                            return [2 /*return*/, { success: true, data: this.mapTags(blog) }];
                    }
                });
            });
        };
        BlogService_1.prototype.getBlogBySlug = function (slug) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .select('id, title, slug, excerpt, content, category, authorName, authorImage, authorRole, featuredImage, readTime, views, publishedAt, createdAt, updatedAt, tags:BlogTag(tag:Tag(name)), comments:Comment(id, author, content, createdAt)')
                                .eq('slug', slug)
                                .single()];
                        case 1:
                            blog = (_a.sent()).data;
                            if (!blog)
                                throw new common_1.NotFoundException('Blog not found');
                            // Increment view count (fire-and-forget)
                            this.db.from('Blog').update({ views: (blog.views || 0) + 1 }).eq('slug', slug).then(function () { });
                            return [2 /*return*/, { success: true, data: this.mapTags(blog) }];
                    }
                });
            });
        };
        BlogService_1.prototype.getBlogById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .select('id, title, slug, excerpt, content, category, authorName, authorImage, authorRole, featuredImage, readTime, views, isFeatured, isPublished, publishedAt, createdAt, updatedAt, tags:BlogTag(tag:Tag(name))')
                                .eq('id', id)
                                .single()];
                        case 1:
                            blog = (_a.sent()).data;
                            if (!blog)
                                throw new common_1.NotFoundException('Blog not found');
                            return [2 /*return*/, { success: true, data: this.mapTags(blog) }];
                    }
                });
            });
        };
        BlogService_1.prototype.getPopularBlogs = function () {
            return __awaiter(this, arguments, void 0, function (limit) {
                var blogs;
                var _this = this;
                if (limit === void 0) { limit = 10; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .select('id, title, slug, excerpt, category, authorName, authorImage, featuredImage, readTime, views, publishedAt, tags:BlogTag(tag:Tag(name))')
                                .eq('isPublished', true)
                                .order('views', { ascending: false })
                                .limit(limit)];
                        case 1:
                            blogs = (_a.sent()).data;
                            return [2 /*return*/, { success: true, data: (blogs || []).map(function (b) { return _this.mapTags(b); }) }];
                    }
                });
            });
        };
        BlogService_1.prototype.getBlogStats = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .select('id, title, slug, views, category, publishedAt, createdAt, updatedAt, isFeatured, isPublished')
                                .eq('id', id)
                                .single()];
                        case 1:
                            blog = (_a.sent()).data;
                            if (!blog)
                                throw new common_1.NotFoundException('Blog not found');
                            return [2 /*return*/, {
                                    success: true,
                                    data: __assign(__assign({}, blog), { daysSincePublished: blog.publishedAt
                                            ? Math.floor((Date.now() - new Date(blog.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
                                            : null }),
                                }];
                    }
                });
            });
        };
        BlogService_1.prototype.incrementBlogView = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var blog, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.from('Blog').select('views').eq('id', id).single()];
                        case 1:
                            blog = (_a.sent()).data;
                            if (!blog)
                                throw new common_1.NotFoundException('Blog not found');
                            return [4 /*yield*/, this.db.from('Blog').update({ views: (blog.views || 0) + 1 }).eq('id', id).select('views').single()];
                        case 2:
                            updated = (_a.sent()).data;
                            return [2 /*return*/, { success: true, views: updated === null || updated === void 0 ? void 0 : updated.views }];
                    }
                });
            });
        };
        BlogService_1.prototype.getCategories = function () {
            return __awaiter(this, void 0, void 0, function () {
                var blogs, counts, _i, _a, b;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db.from('Blog').select('category').eq('isPublished', true)];
                        case 1:
                            blogs = (_b.sent()).data;
                            counts = {};
                            for (_i = 0, _a = blogs || []; _i < _a.length; _i++) {
                                b = _a[_i];
                                counts[b.category] = (counts[b.category] || 0) + 1;
                            }
                            return [2 /*return*/, { success: true, data: Object.entries(counts).map(function (_a) {
                                        var name = _a[0], count = _a[1];
                                        return ({ name: name, count: count });
                                    }) }];
                    }
                });
            });
        };
        BlogService_1.prototype.getRelatedBlogs = function (category_1, excludeSlug_1) {
            return __awaiter(this, arguments, void 0, function (category, excludeSlug, limit) {
                var blogs;
                var _this = this;
                if (limit === void 0) { limit = 3; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .select('id, title, slug, excerpt, category, featuredImage, readTime, publishedAt, tags:BlogTag(tag:Tag(name))')
                                .eq('isPublished', true)
                                .eq('category', category)
                                .neq('slug', excludeSlug)
                                .order('publishedAt', { ascending: false })
                                .limit(limit)];
                        case 1:
                            blogs = (_a.sent()).data;
                            return [2 /*return*/, { success: true, data: (blogs || []).map(function (b) { return _this.mapTags(b); }) }];
                    }
                });
            });
        };
        BlogService_1.prototype.createBlog = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, tags, rest, _b, blog, error, tagRecords, finalBlog;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!data.slug) {
                                data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                            }
                            _a = data.tags, tags = _a === void 0 ? [] : _a, rest = __rest(data, ["tags"]);
                            return [4 /*yield*/, this.db
                                    .from('Blog')
                                    .insert(__assign(__assign({}, rest), { publishedAt: rest.isPublished ? new Date().toISOString() : null }))
                                    .select('id, title, slug, excerpt, content, category, authorName, authorImage, authorRole, featuredImage, readTime, isFeatured, isPublished, publishedAt, createdAt')
                                    .single()];
                        case 1:
                            _b = _c.sent(), blog = _b.data, error = _b.error;
                            if (error)
                                throw error;
                            if (!(tags.length > 0)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.upsertTags(tags)];
                        case 2:
                            tagRecords = _c.sent();
                            return [4 /*yield*/, this.db.from('BlogTag').insert(tagRecords.filter(Boolean).map(function (t) { return ({ blogId: blog.id, tagId: t.id }); }))];
                        case 3:
                            _c.sent();
                            _c.label = 4;
                        case 4: return [4 /*yield*/, this.db
                                .from('Blog')
                                .select('*, tags:BlogTag(tag:Tag(name))')
                                .eq('id', blog.id)
                                .single()];
                        case 5:
                            finalBlog = (_c.sent()).data;
                            return [2 /*return*/, { success: true, message: 'Blog created successfully', data: this.mapTags(finalBlog) }];
                    }
                });
            });
        };
        BlogService_1.prototype.updateBlog = function (id, data) {
            return __awaiter(this, void 0, void 0, function () {
                var existingBlog, tags, rest, updateData, tagRecords, blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.from('Blog').select('id, publishedAt').eq('id', id).single()];
                        case 1:
                            existingBlog = (_a.sent()).data;
                            if (!existingBlog)
                                throw new common_1.NotFoundException('Blog not found');
                            tags = data.tags, rest = __rest(data, ["tags"]);
                            updateData = __assign({}, rest);
                            if (data.isPublished && !existingBlog.publishedAt) {
                                updateData.publishedAt = new Date().toISOString();
                            }
                            return [4 /*yield*/, this.db.from('Blog').update(updateData).eq('id', id)];
                        case 2:
                            _a.sent();
                            if (!(tags !== undefined)) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.upsertTags(tags)];
                        case 3:
                            tagRecords = _a.sent();
                            return [4 /*yield*/, this.db.from('BlogTag').delete().eq('blogId', id)];
                        case 4:
                            _a.sent();
                            if (!tagRecords.length) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.db.from('BlogTag').insert(tagRecords.filter(Boolean).map(function (t) { return ({ blogId: id, tagId: t.id }); }))];
                        case 5:
                            _a.sent();
                            _a.label = 6;
                        case 6: return [4 /*yield*/, this.db.from('Blog').select('*, tags:BlogTag(tag:Tag(name))').eq('id', id).single()];
                        case 7:
                            blog = (_a.sent()).data;
                            return [2 /*return*/, { success: true, message: 'Blog updated successfully', data: this.mapTags(blog) }];
                    }
                });
            });
        };
        BlogService_1.prototype.deleteBlog = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var blog;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.from('Blog').select('id').eq('id', id).single()];
                        case 1:
                            blog = (_a.sent()).data;
                            if (!blog)
                                throw new common_1.NotFoundException('Blog not found');
                            return [4 /*yield*/, this.db.from('Blog').delete().eq('id', id)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { success: true, message: 'Blog deleted successfully' }];
                    }
                });
            });
        };
        BlogService_1.prototype.searchBlogs = function (query_1) {
            return __awaiter(this, arguments, void 0, function (query, limit) {
                var blogs;
                var _this = this;
                if (limit === void 0) { limit = 10; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .select('id, title, slug, excerpt, category, featuredImage, readTime, publishedAt, tags:BlogTag(tag:Tag(name))')
                                .eq('isPublished', true)
                                .or("title.ilike.%".concat(query, "%,excerpt.ilike.%").concat(query, "%,content.ilike.%").concat(query, "%"))
                                .order('publishedAt', { ascending: false })
                                .limit(limit)];
                        case 1:
                            blogs = (_a.sent()).data;
                            return [2 /*return*/, { success: true, data: (blogs || []).map(function (b) { return _this.mapTags(b); }), count: (blogs === null || blogs === void 0 ? void 0 : blogs.length) || 0 }];
                    }
                });
            });
        };
        BlogService_1.prototype.getAllTags = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                var tags, tagsWithCount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Tag')
                                .select('id, name, slug, blogs:BlogTag(blogId, blog:Blog(isPublished))')
                                .order('name', { ascending: true })];
                        case 1:
                            tags = (_a.sent()).data;
                            tagsWithCount = (tags || [])
                                .map(function (tag) { return ({
                                name: tag.name,
                                slug: tag.slug,
                                count: (tag.blogs || []).filter(function (b) { var _a; return (_a = b.blog) === null || _a === void 0 ? void 0 : _a.isPublished; }).length,
                            }); })
                                .filter(function (t) { return t.count > 0; })
                                .sort(function (a, b) { return b.count - a.count; });
                            if (limit)
                                tagsWithCount = tagsWithCount.slice(0, limit);
                            return [2 /*return*/, { success: true, data: tagsWithCount }];
                    }
                });
            });
        };
        BlogService_1.prototype.searchBlogsByTag = function (tag_1) {
            return __awaiter(this, arguments, void 0, function (tag, limit, offset) {
                var normalizedTag, tagRecord, blogTags, blogIds, _a, blogs, count;
                var _this = this;
                if (limit === void 0) { limit = 10; }
                if (offset === void 0) { offset = 0; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            normalizedTag = this.normalizeTagName(tag);
                            if (!normalizedTag)
                                return [2 /*return*/, { success: true, data: [], count: 0, pagination: { total: 0, limit: limit, offset: offset, hasMore: false } }];
                            return [4 /*yield*/, this.db.from('Tag').select('id').eq('name', normalizedTag).single()];
                        case 1:
                            tagRecord = (_b.sent()).data;
                            if (!tagRecord)
                                return [2 /*return*/, { success: true, data: [], count: 0, pagination: { total: 0, limit: limit, offset: offset, hasMore: false } }];
                            return [4 /*yield*/, this.db.from('BlogTag').select('blogId').eq('tagId', tagRecord.id)];
                        case 2:
                            blogTags = (_b.sent()).data;
                            blogIds = (blogTags || []).map(function (bt) { return bt.blogId; });
                            if (!blogIds.length)
                                return [2 /*return*/, { success: true, data: [], count: 0, pagination: { total: 0, limit: limit, offset: offset, hasMore: false } }];
                            return [4 /*yield*/, this.db
                                    .from('Blog')
                                    .select('id, title, slug, excerpt, category, featuredImage, readTime, publishedAt, tags:BlogTag(tag:Tag(name))', { count: 'exact' })
                                    .eq('isPublished', true)
                                    .in('id', blogIds)
                                    .order('publishedAt', { ascending: false })
                                    .range(offset, offset + limit - 1)];
                        case 3:
                            _a = _b.sent(), blogs = _a.data, count = _a.count;
                            return [2 /*return*/, {
                                    success: true,
                                    data: (blogs || []).map(function (b) { return _this.mapTags(b); }),
                                    count: count || 0,
                                    pagination: { total: count || 0, limit: limit, offset: offset, hasMore: offset + ((blogs === null || blogs === void 0 ? void 0 : blogs.length) || 0) < (count || 0) },
                                }];
                    }
                });
            });
        };
        BlogService_1.prototype.addCommentToBlog = function (blogId, data) {
            return __awaiter(this, void 0, void 0, function () {
                var blog, _a, comment, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db.from('Blog').select('id').eq('id', blogId).single()];
                        case 1:
                            blog = (_b.sent()).data;
                            if (!blog)
                                throw new common_1.NotFoundException('Blog not found');
                            return [4 /*yield*/, this.db
                                    .from('Comment')
                                    .insert({ blogId: blogId, author: data.author, content: data.content })
                                    .select('id, author, content, createdAt')
                                    .single()];
                        case 2:
                            _a = _b.sent(), comment = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, { success: true, message: 'Comment added successfully', data: comment }];
                    }
                });
            });
        };
        BlogService_1.prototype.addReplyToComment = function (commentId, data) {
            return __awaiter(this, void 0, void 0, function () {
                var parent, _a, reply, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db.from('Comment').select('id, blogId').eq('id', commentId).single()];
                        case 1:
                            parent = (_b.sent()).data;
                            if (!parent)
                                throw new common_1.NotFoundException('Comment not found');
                            return [4 /*yield*/, this.db
                                    .from('Comment')
                                    .insert({ blogId: parent.blogId, parentId: commentId, author: data.author, content: data.content })
                                    .select('id, author, content, likes, createdAt')
                                    .single()];
                        case 2:
                            _a = _b.sent(), reply = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, { success: true, message: 'Reply added successfully', data: reply }];
                    }
                });
            });
        };
        BlogService_1.prototype.deleteComment = function (commentId) {
            return __awaiter(this, void 0, void 0, function () {
                var comment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.from('Comment').select('id').eq('id', commentId).single()];
                        case 1:
                            comment = (_a.sent()).data;
                            if (!comment)
                                throw new common_1.NotFoundException('Comment not found');
                            // Delete likes and replies first, then the comment
                            return [4 /*yield*/, this.db.from('CommentLike').delete().eq('commentId', commentId)];
                        case 2:
                            // Delete likes and replies first, then the comment
                            _a.sent();
                            return [4 /*yield*/, this.db.from('Comment').delete().eq('parentId', commentId)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.db.from('Comment').delete().eq('id', commentId)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, { success: true, message: 'Comment deleted successfully' }];
                    }
                });
            });
        };
        BlogService_1.prototype.toggleCommentLike = function (commentId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var comment, existing, currentLikes;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.from('Comment').select('id, likes').eq('id', commentId).single()];
                        case 1:
                            comment = (_a.sent()).data;
                            if (!comment)
                                throw new common_1.NotFoundException('Comment not found');
                            return [4 /*yield*/, this.db
                                    .from('CommentLike')
                                    .select('id')
                                    .eq('commentId', commentId)
                                    .eq('userId', userId)
                                    .single()];
                        case 2:
                            existing = (_a.sent()).data;
                            currentLikes = comment.likes || 0;
                            if (!existing) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.db.from('CommentLike').delete().eq('id', existing.id)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.db.from('Comment').update({ likes: Math.max(0, currentLikes - 1) }).eq('id', commentId)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, { success: true, message: 'Comment unliked', liked: false, likesCount: Math.max(0, currentLikes - 1) }];
                        case 5: return [4 /*yield*/, this.db.from('CommentLike').insert({ commentId: commentId, userId: userId })];
                        case 6:
                            _a.sent();
                            return [4 /*yield*/, this.db.from('Comment').update({ likes: currentLikes + 1 }).eq('id', commentId)];
                        case 7:
                            _a.sent();
                            return [2 /*return*/, { success: true, message: 'Comment liked', liked: true, likesCount: currentLikes + 1 }];
                    }
                });
            });
        };
        BlogService_1.prototype.getCommentsForBlog = function (blogId_1) {
            return __awaiter(this, arguments, void 0, function (blogId, limit, offset) {
                var blog, _a, comments, count, total;
                if (limit === void 0) { limit = 20; }
                if (offset === void 0) { offset = 0; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db.from('Blog').select('id').eq('id', blogId).single()];
                        case 1:
                            blog = (_b.sent()).data;
                            if (!blog)
                                throw new common_1.NotFoundException('Blog not found');
                            return [4 /*yield*/, this.db
                                    .from('Comment')
                                    .select('id, author, content, likes, createdAt, replies:Comment!parentId(id, author, content, likes, createdAt)', { count: 'exact' })
                                    .eq('blogId', blogId)
                                    .is('parentId', null)
                                    .order('createdAt', { ascending: false })
                                    .range(offset, offset + limit - 1)];
                        case 2:
                            _a = _b.sent(), comments = _a.data, count = _a.count;
                            total = count || 0;
                            return [2 /*return*/, {
                                    success: true,
                                    data: comments || [],
                                    pagination: { total: total, limit: limit, offset: offset, hasMore: offset + ((comments === null || comments === void 0 ? void 0 : comments.length) || 0) < total },
                                }];
                    }
                });
            });
        };
        // ==================== ADMIN METHODS ====================
        BlogService_1.prototype.getAllBlogsAdmin = function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b, limit, _c, offset, _d, blogs, count;
                var _this = this;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _a = options || {}, _b = _a.limit, limit = _b === void 0 ? 50 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                            return [4 /*yield*/, this.db
                                    .from('Blog')
                                    .select('id, title, slug, excerpt, content, category, authorName, authorImage, authorRole, featuredImage, readTime, views, isFeatured, isPublished, publishedAt, createdAt, updatedAt, tags:BlogTag(tag:Tag(name))', { count: 'exact' })
                                    .order('createdAt', { ascending: false })
                                    .range(offset, offset + limit - 1)];
                        case 1:
                            _d = _e.sent(), blogs = _d.data, count = _d.count;
                            return [2 /*return*/, {
                                    success: true,
                                    data: (blogs || []).map(function (b) { return _this.mapTags(b); }),
                                    pagination: { total: count || 0, limit: limit, offset: offset, hasMore: offset + ((blogs === null || blogs === void 0 ? void 0 : blogs.length) || 0) < (count || 0) },
                                }];
                    }
                });
            });
        };
        BlogService_1.prototype.getBlogStatistics = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, total, published, draft, featured, viewsData, totalViews;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.db.from('Blog').select('*', { count: 'exact', head: true }),
                                this.db.from('Blog').select('*', { count: 'exact', head: true }).eq('isPublished', true),
                                this.db.from('Blog').select('*', { count: 'exact', head: true }).eq('isPublished', false),
                                this.db.from('Blog').select('*', { count: 'exact', head: true }).eq('isFeatured', true).eq('isPublished', true),
                                this.db.from('Blog').select('views'),
                            ])];
                        case 1:
                            _a = _b.sent(), total = _a[0].count, published = _a[1].count, draft = _a[2].count, featured = _a[3].count, viewsData = _a[4].data;
                            totalViews = (viewsData || []).reduce(function (sum, b) { return sum + (b.views || 0); }, 0);
                            return [2 /*return*/, { success: true, data: { total: total || 0, published: published || 0, draft: draft || 0, featured: featured || 0, totalViews: totalViews } }];
                    }
                });
            });
        };
        BlogService_1.prototype.bulkDeleteBlogs = function (blogIds) {
            return __awaiter(this, void 0, void 0, function () {
                var error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!blogIds || blogIds.length === 0)
                                return [2 /*return*/, { success: false, message: 'No blog IDs provided' }];
                            return [4 /*yield*/, this.db.from('Blog').delete().in('id', blogIds)];
                        case 1:
                            error = (_a.sent()).error;
                            if (error)
                                throw error;
                            return [2 /*return*/, { success: true, message: "".concat(blogIds.length, " blog(s) deleted successfully"), deleted: blogIds.length }];
                    }
                });
            });
        };
        BlogService_1.prototype.bulkUpdateStatus = function (blogIds, isPublished) {
            return __awaiter(this, void 0, void 0, function () {
                var updateData, withoutDate, withoutDateIds_1, withDateIds;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!blogIds || blogIds.length === 0)
                                return [2 /*return*/, { success: false, message: 'No blog IDs provided' }];
                            updateData = { isPublished: isPublished };
                            if (!isPublished) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.db.from('Blog').select('id').in('id', blogIds).is('publishedAt', null)];
                        case 1:
                            withoutDate = (_a.sent()).data;
                            withoutDateIds_1 = (withoutDate || []).map(function (b) { return b.id; });
                            if (!withoutDateIds_1.length) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.db.from('Blog').update({ isPublished: true, publishedAt: new Date().toISOString() }).in('id', withoutDateIds_1)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            withDateIds = blogIds.filter(function (id) { return !withoutDateIds_1.includes(id); });
                            if (!withDateIds.length) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.db.from('Blog').update({ isPublished: true }).in('id', withDateIds)];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5: return [2 /*return*/, { success: true, message: "".concat(blogIds.length, " blog(s) published successfully"), updated: blogIds.length }];
                        case 6: return [4 /*yield*/, this.db.from('Blog').update({ isPublished: false }).in('id', blogIds)];
                        case 7:
                            _a.sent();
                            return [2 /*return*/, { success: true, message: "".concat(blogIds.length, " blog(s) unpublished successfully"), updated: blogIds.length }];
                    }
                });
            });
        };
        BlogService_1.prototype.submitForApproval = function (blogId, notes) {
            return __awaiter(this, void 0, void 0, function () {
                var blog, _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db.from('Blog').select('id, status').eq('id', blogId).single()];
                        case 1:
                            blog = (_b.sent()).data;
                            if (!blog)
                                throw new Error('Blog not found');
                            if (blog.status !== 'draft')
                                throw new Error('Only draft blogs can be submitted for approval');
                            return [4 /*yield*/, this.db
                                    .from('Blog')
                                    .update({ status: 'pending', submittedAt: new Date().toISOString() })
                                    .eq('id', blogId)
                                    .select()
                                    .single()];
                        case 2:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        BlogService_1.prototype.publishBlog = function (blogId_1) {
            return __awaiter(this, arguments, void 0, function (blogId, visibility) {
                var blog, _a, data, error;
                if (visibility === void 0) { visibility = 'public'; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db.from('Blog').select('id').eq('id', blogId).single()];
                        case 1:
                            blog = (_b.sent()).data;
                            if (!blog)
                                throw new Error('Blog not found');
                            return [4 /*yield*/, this.db
                                    .from('Blog')
                                    .update({ status: 'published', visibility: visibility, isPublished: visibility === 'public', publishedAt: new Date().toISOString() })
                                    .eq('id', blogId)
                                    .select()
                                    .single()];
                        case 2:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        BlogService_1.prototype.unpublishBlog = function (blogId, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var blog, _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db.from('Blog').select('id, status').eq('id', blogId).single()];
                        case 1:
                            blog = (_b.sent()).data;
                            if (!blog)
                                throw new Error('Blog not found');
                            if (blog.status !== 'published')
                                throw new Error('Only published blogs can be unpublished');
                            return [4 /*yield*/, this.db
                                    .from('Blog')
                                    .update({ status: 'draft', isPublished: false, publishedAt: null })
                                    .eq('id', blogId)
                                    .select()
                                    .single()];
                        case 2:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        BlogService_1.prototype.approveBlog = function (blogId, approvedBy, notes) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .update({ approvedAt: new Date().toISOString(), approvedBy: approvedBy })
                                .eq('id', blogId)
                                .select()
                                .single()];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        BlogService_1.prototype.rejectBlog = function (blogId, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .update({ status: 'draft', rejectionReason: reason, approvedAt: null, approvedBy: null })
                                .eq('id', blogId)
                                .select()
                                .single()];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        BlogService_1.prototype.getAdminBlogs = function (filter_1) {
            return __awaiter(this, arguments, void 0, function (filter, options) {
                var _a, limit, _b, offset, query, _c, blogs, count;
                var _this = this;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _a = options.limit, limit = _a === void 0 ? 20 : _a, _b = options.offset, offset = _b === void 0 ? 0 : _b;
                            query = this.db
                                .from('Blog')
                                .select('id, title, slug, excerpt, category, authorName, authorImage, authorRole, authorId, featuredImage, status, visibility, isPublished, readTime, views, publishedAt, createdAt, updatedAt, tags:BlogTag(tag:Tag(name))', { count: 'exact' })
                                .order('updatedAt', { ascending: false })
                                .range(offset, offset + limit - 1);
                            // Apply filter conditions
                            if (filter.isPublished !== undefined)
                                query = query.eq('isPublished', filter.isPublished);
                            if (filter.status)
                                query = query.eq('status', filter.status);
                            if (filter.authorId)
                                query = query.eq('authorId', filter.authorId);
                            return [4 /*yield*/, query];
                        case 1:
                            _c = _d.sent(), blogs = _c.data, count = _c.count;
                            return [2 /*return*/, {
                                    success: true,
                                    data: (blogs || []).map(function (b) { return _this.mapTags(b); }),
                                    pagination: { total: count || 0, limit: limit, offset: offset, hasMore: offset + ((blogs === null || blogs === void 0 ? void 0 : blogs.length) || 0) < (count || 0) },
                                }];
                    }
                });
            });
        };
        BlogService_1.prototype.getAdminBlogDetail = function (blogId) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Blog')
                                .select('*, tags:BlogTag(tag:Tag(name))')
                                .eq('id', blogId)
                                .single()];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data ? this.mapTags(data) : null];
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

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
exports.CommunityController = void 0;
var common_1 = require("@nestjs/common");
var admin_guard_1 = require("../auth/admin.guard");
var user_guard_1 = require("../auth/user.guard");
var CommunityController = function () {
    var _classDecorators = [(0, common_1.Controller)('community')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getAllMentors_decorators;
    var _getFeaturedMentors_decorators;
    var _getMentorById_decorators;
    var _bookMentorSession_decorators;
    var _applyAsMentor_decorators;
    var _getMentorStats_decorators;
    var _getAllEvents_decorators;
    var _getUpcomingEvents_decorators;
    var _getPastEvents_decorators;
    var _getEventById_decorators;
    var _registerForEvent_decorators;
    var _getAllStories_decorators;
    var _getFeaturedStories_decorators;
    var _getStoryById_decorators;
    var _submitStory_decorators;
    var _getAllResources_decorators;
    var _getPopularResources_decorators;
    var _getResourceById_decorators;
    var _trackResourceView_decorators;
    var _createMentor_decorators;
    var _updateMentor_decorators;
    var _deleteMentor_decorators;
    var _createEvent_decorators;
    var _updateEvent_decorators;
    var _deleteEvent_decorators;
    var _createResource_decorators;
    var _updateResource_decorators;
    var _deleteResource_decorators;
    var _approveMentor_decorators;
    var _approveStory_decorators;
    var _getAllBookings_decorators;
    var _getAllRegistrations_decorators;
    var _getCommunityStats_decorators;
    var _getAllForumPosts_decorators;
    var _getForumPostById_decorators;
    var _createForumPost_decorators;
    var _createForumComment_decorators;
    var _likeForumComment_decorators;
    var _likeForumPost_decorators;
    var _shareForumPost_decorators;
    var _requestMentorOTP_decorators;
    var _verifyMentorOTP_decorators;
    var _getMentorProfile_decorators;
    var _getMentorBookings_decorators;
    var _updateBookingStatus_decorators;
    var _updateMentorProfile_decorators;
    var CommunityController = _classThis = /** @class */ (function () {
        function CommunityController_1(communityService, jwtService) {
            this.communityService = (__runInitializers(this, _instanceExtraInitializers), communityService);
            this.jwtService = jwtService;
        }
        // ==================== MENTORSHIP ENDPOINTS ====================
        /**
         * Get all active mentors with filters
         * GET /community/mentors
         * @query university - Filter by university (optional)
         * @query country - Filter by country (optional)
         * @query loanType - Filter by loan type (optional)
         * @query category - Filter by category (optional)
         * @query limit - Number of mentors (default: 10)
         * @query offset - Skip mentors (default: 0)
         */
        CommunityController_1.prototype.getAllMentors = function (university, country, loanType, category, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getAllMentors({
                            university: university,
                            country: country,
                            loanType: loanType,
                            category: category,
                            limit: limit ? parseInt(limit, 10) : 10,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get featured mentors (top-rated)
         * GET /community/mentors/featured
         * @query limit - Number of mentors (default: 6)
         */
        CommunityController_1.prototype.getFeaturedMentors = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getFeaturedMentors(limit ? parseInt(limit, 10) : 6)];
                });
            });
        };
        /**
         * Get mentor by ID
         * GET /community/mentors/:id
         */
        CommunityController_1.prototype.getMentorById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getMentorById(id)];
                });
            });
        };
        /**
         * Book a mentorship session
         * POST /community/mentors/:id/book
         * @param id - Mentor ID
         * @body studentName, studentEmail, preferredDate, preferredTime, message
         */
        CommunityController_1.prototype.bookMentorSession = function (mentorId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.bookMentorSession(mentorId, body)];
                });
            });
        };
        /**
         * Submit mentor application
         * POST /community/mentors/apply
         * @body name, email, university, degree, country, loanBank, loanAmount, bio, expertise
         */
        CommunityController_1.prototype.applyAsMentor = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.applyAsMentor(body)];
                });
            });
        };
        /**
         * Get mentor statistics
         * GET /community/mentors/stats
         */
        CommunityController_1.prototype.getMentorStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getMentorStats()];
                });
            });
        };
        // ==================== EVENTS ENDPOINTS ====================
        /**
         * Get all upcoming events
         * GET /community/events
         * @query type - Filter by type (webinar, qa, networking, workshop)
         * @query featured - Filter featured events
         * @query limit - Number of events (default: 10)
         * @query offset - Skip events (default: 0)
         */
        CommunityController_1.prototype.getAllEvents = function (type, category, featured, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getAllEvents({
                            type: type,
                            category: category,
                            featured: featured === 'true' ? true : undefined,
                            limit: limit ? parseInt(limit, 10) : 10,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get upcoming events only
         * GET /community/events/upcoming
         * @query limit - Number of events (default: 5)
         */
        CommunityController_1.prototype.getUpcomingEvents = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getUpcomingEvents(limit ? parseInt(limit, 10) : 5)];
                });
            });
        };
        /**
         * Get past events / recordings
         * GET /community/events/past
         * @query limit - Number of events (default: 10)
         * @query offset - Skip events (default: 0)
         */
        CommunityController_1.prototype.getPastEvents = function (limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getPastEvents(limit ? parseInt(limit, 10) : 10, offset ? parseInt(offset, 10) : 0)];
                });
            });
        };
        /**
         * Get event by ID
         * GET /community/events/:id
         */
        CommunityController_1.prototype.getEventById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getEventById(id)];
                });
            });
        };
        /**
         * Register for an event
         * POST /community/events/:id/register
         * @param id - Event ID
         * @body name, email, phone
         */
        CommunityController_1.prototype.registerForEvent = function (eventId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.registerForEvent(eventId, body)];
                });
            });
        };
        // ==================== SUCCESS STORIES ENDPOINTS ====================
        /**
         * Get all success stories
         * GET /community/stories
         * @query country - Filter by country
         * @query category - Filter by category (MBA, Engineering, Medical, etc.)
         * @query limit - Number of stories (default: 10)
         * @query offset - Skip stories (default: 0)
         */
        CommunityController_1.prototype.getAllStories = function (country, category, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getAllStories({
                            country: country,
                            category: category,
                            limit: limit ? parseInt(limit, 10) : 10,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get featured success stories
         * GET /community/stories/featured
         * @query limit - Number of stories (default: 6)
         */
        CommunityController_1.prototype.getFeaturedStories = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getFeaturedStories(limit ? parseInt(limit, 10) : 6)];
                });
            });
        };
        /**
         * Get story by ID
         * GET /community/stories/:id
         */
        CommunityController_1.prototype.getStoryById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getStoryById(id)];
                });
            });
        };
        /**
         * Submit a success story
         * POST /community/stories/submit
         * @body name, email, university, country, degree, loanAmount, bank, story, tips
         */
        CommunityController_1.prototype.submitStory = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.submitStory(body)];
                });
            });
        };
        // ==================== RESOURCES ENDPOINTS ====================
        /**
         * Get all community resources
         * GET /community/resources
         * @query type - Filter by type (guide, template, checklist, video)
         * @query category - Filter by category
         * @query limit - Number of resources (default: 10)
         * @query offset - Skip resources (default: 0)
         */
        CommunityController_1.prototype.getAllResources = function (type, category, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getAllResources({
                            type: type,
                            category: category,
                            limit: limit ? parseInt(limit, 10) : 10,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get popular resources
         * GET /community/resources/popular
         * @query limit - Number of resources (default: 5)
         */
        CommunityController_1.prototype.getPopularResources = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getPopularResources(limit ? parseInt(limit, 10) : 5)];
                });
            });
        };
        /**
         * Get resource by ID
         * GET /community/resources/:id
         */
        CommunityController_1.prototype.getResourceById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getResourceById(id)];
                });
            });
        };
        /**
         * Track resource download/view
         * POST /community/resources/:id/track
         */
        CommunityController_1.prototype.trackResourceView = function (resourceId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.trackResourceView(resourceId)];
                });
            });
        };
        // ==================== ADMIN ENDPOINTS ====================
        /**
         * Create a new mentor (Admin)
         * POST /community/admin/mentors
         */
        CommunityController_1.prototype.createMentor = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.createMentor(body)];
                });
            });
        };
        /**
         * Update mentor (Admin)
         * PUT /community/admin/mentors/:id
         */
        CommunityController_1.prototype.updateMentor = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.updateMentor(id, body)];
                });
            });
        };
        /**
         * Delete mentor (Admin)
         * DELETE /community/admin/mentors/:id
         */
        CommunityController_1.prototype.deleteMentor = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.deleteMentor(id)];
                });
            });
        };
        /**
         * Create event (Admin)
         * POST /community/admin/events
         */
        CommunityController_1.prototype.createEvent = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.createEvent(body)];
                });
            });
        };
        /**
         * Update event (Admin)
         * PUT /community/admin/events/:id
         */
        CommunityController_1.prototype.updateEvent = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.updateEvent(id, body)];
                });
            });
        };
        /**
         * Delete event (Admin)
         * DELETE /community/admin/events/:id
         */
        CommunityController_1.prototype.deleteEvent = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.deleteEvent(id)];
                });
            });
        };
        /**
         * Create resource (Admin)
         * POST /community/admin/resources
         */
        CommunityController_1.prototype.createResource = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.createResource(body)];
                });
            });
        };
        /**
         * Update resource (Admin)
         * PUT /community/admin/resources/:id
         */
        CommunityController_1.prototype.updateResource = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.updateResource(id, body)];
                });
            });
        };
        /**
         * Delete resource (Admin)
         * DELETE /community/admin/resources/:id
         */
        CommunityController_1.prototype.deleteResource = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.deleteResource(id)];
                });
            });
        };
        /**
         * Approve/Reject mentor application (Admin)
         * PUT /community/admin/mentors/:id/approve
         */
        CommunityController_1.prototype.approveMentor = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.approveMentor(id, body.approved, body.reason)];
                });
            });
        };
        /**
         * Approve/Reject success story (Admin)
         * PUT /community/admin/stories/:id/approve
         */
        CommunityController_1.prototype.approveStory = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.approveStory(id, body.approved, body.reason)];
                });
            });
        };
        /**
         * Get all mentor bookings (Admin)
         * GET /community/admin/bookings
         */
        CommunityController_1.prototype.getAllBookings = function (status, mentorId, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getAllBookings({
                            status: status,
                            mentorId: mentorId,
                            limit: limit ? parseInt(limit, 10) : 20,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get all event registrations (Admin)
         * GET /community/admin/registrations
         */
        CommunityController_1.prototype.getAllRegistrations = function (eventId, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getAllRegistrations({
                            eventId: eventId,
                            limit: limit ? parseInt(limit, 10) : 50,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get community statistics (Admin)
         * GET /community/admin/stats
         */
        CommunityController_1.prototype.getCommunityStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getCommunityStats()];
                });
            });
        };
        // ==================== FORUM ENDPOINTS ====================
        CommunityController_1.prototype.getAllForumPosts = function (category, tag, limit, offset, sort, req) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, authHeader, token, decoded;
                var _a;
                return __generator(this, function (_b) {
                    try {
                        authHeader = (_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a.authorization;
                        if (authHeader && authHeader.startsWith('Bearer ')) {
                            token = authHeader.split(' ')[1];
                            decoded = this.jwtService.decode(token);
                            if (decoded && decoded.id) {
                                userId = decoded.id;
                            }
                        }
                    }
                    catch (e) {
                        // ignore token errors
                    }
                    return [2 /*return*/, this.communityService.getForumPosts({
                            category: category,
                            tag: tag,
                            limit: limit ? parseInt(limit, 10) : 10,
                            offset: offset ? parseInt(offset, 10) : 0,
                            sort: sort,
                        }, userId)];
                });
            });
        };
        CommunityController_1.prototype.getForumPostById = function (id, req) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, authHeader, token, decoded;
                return __generator(this, function (_a) {
                    try {
                        authHeader = req.headers.authorization;
                        if (authHeader && authHeader.startsWith('Bearer ')) {
                            token = authHeader.split(' ')[1];
                            decoded = this.jwtService.decode(token);
                            if (decoded && decoded.id) {
                                userId = decoded.id;
                            }
                        }
                    }
                    catch (e) {
                        // ignore token errors
                    }
                    return [2 /*return*/, this.communityService.getForumPostById(id, userId)];
                });
            });
        };
        CommunityController_1.prototype.createForumPost = function (req, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.createForumPost(req.user.id, body)];
                });
            });
        };
        CommunityController_1.prototype.createForumComment = function (req, id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log("[CommunityController] createForumComment for post ".concat(id, " by user ").concat(req.user.id));
                    console.log("[CommunityController] body:", body);
                    return [2 /*return*/, this.communityService.createForumComment(req.user.id, id, body.content, body.parentId)];
                });
            });
        };
        CommunityController_1.prototype.likeForumComment = function (req, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.likeForumComment(req.user.id, id)];
                });
            });
        };
        CommunityController_1.prototype.likeForumPost = function (req, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.likeForumPost(req.user.id, id)];
                });
            });
        };
        CommunityController_1.prototype.shareForumPost = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.shareForumPost(id)];
                });
            });
        };
        // ==================== MENTOR DASHBOARD ENDPOINTS ====================
        /**
         * Request Mentor OTP
         * POST /community/mentor/request-otp
         * @body email
         */
        CommunityController_1.prototype.requestMentorOTP = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.requestMentorOTP(body.email)];
                });
            });
        };
        /**
         * Verify Mentor OTP & Login
         * POST /community/mentor/verify-otp
         * @body email, otp
         */
        CommunityController_1.prototype.verifyMentorOTP = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.verifyMentorOTP(body.email, body.otp)];
                });
            });
        };
        /**
         * Get Mentor Profile & Stats
         * GET /community/mentor/profile/:id
         */
        CommunityController_1.prototype.getMentorProfile = function (mentorId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getMentorProfile(mentorId)];
                });
            });
        };
        /**
         * Get Mentor's Bookings
         * GET /community/mentor/:id/bookings
         */
        CommunityController_1.prototype.getMentorBookings = function (mentorId, status, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.getMentorBookings(mentorId, {
                            status: status,
                            limit: limit ? parseInt(limit, 10) : 20,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Update Booking Status (Mentor)
         * PUT /community/mentor/:mentorId/bookings/:bookingId
         */
        CommunityController_1.prototype.updateBookingStatus = function (mentorId, bookingId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.updateBookingStatus(mentorId, bookingId, body.status)];
                });
            });
        };
        /**
         * Update Mentor Profile
         * PUT /community/mentor/:id/profile
         */
        CommunityController_1.prototype.updateMentorProfile = function (mentorId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.communityService.updateMentorProfile(mentorId, body)];
                });
            });
        };
        return CommunityController_1;
    }());
    __setFunctionName(_classThis, "CommunityController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getAllMentors_decorators = [(0, common_1.Get)('mentors')];
        _getFeaturedMentors_decorators = [(0, common_1.Get)('mentors/featured')];
        _getMentorById_decorators = [(0, common_1.Get)('mentors/:id')];
        _bookMentorSession_decorators = [(0, common_1.Post)('mentors/:id/book')];
        _applyAsMentor_decorators = [(0, common_1.Post)('mentors/apply')];
        _getMentorStats_decorators = [(0, common_1.Get)('mentors/stats')];
        _getAllEvents_decorators = [(0, common_1.Get)('events')];
        _getUpcomingEvents_decorators = [(0, common_1.Get)('events/upcoming')];
        _getPastEvents_decorators = [(0, common_1.Get)('events/past')];
        _getEventById_decorators = [(0, common_1.Get)('events/:id')];
        _registerForEvent_decorators = [(0, common_1.Post)('events/:id/register')];
        _getAllStories_decorators = [(0, common_1.Get)('stories')];
        _getFeaturedStories_decorators = [(0, common_1.Get)('stories/featured')];
        _getStoryById_decorators = [(0, common_1.Get)('stories/:id')];
        _submitStory_decorators = [(0, common_1.Post)('stories/submit')];
        _getAllResources_decorators = [(0, common_1.Get)('resources')];
        _getPopularResources_decorators = [(0, common_1.Get)('resources/popular')];
        _getResourceById_decorators = [(0, common_1.Get)('resources/:id')];
        _trackResourceView_decorators = [(0, common_1.Post)('resources/:id/track')];
        _createMentor_decorators = [(0, common_1.Post)('admin/mentors'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _updateMentor_decorators = [(0, common_1.Put)('admin/mentors/:id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _deleteMentor_decorators = [(0, common_1.Delete)('admin/mentors/:id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _createEvent_decorators = [(0, common_1.Post)('admin/events'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _updateEvent_decorators = [(0, common_1.Put)('admin/events/:id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _deleteEvent_decorators = [(0, common_1.Delete)('admin/events/:id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _createResource_decorators = [(0, common_1.Post)('admin/resources'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _updateResource_decorators = [(0, common_1.Put)('admin/resources/:id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _deleteResource_decorators = [(0, common_1.Delete)('admin/resources/:id'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _approveMentor_decorators = [(0, common_1.Put)('admin/mentors/:id/approve'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _approveStory_decorators = [(0, common_1.Put)('admin/stories/:id/approve'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getAllBookings_decorators = [(0, common_1.Get)('admin/bookings'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getAllRegistrations_decorators = [(0, common_1.Get)('admin/registrations'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getCommunityStats_decorators = [(0, common_1.Get)('admin/stats'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getAllForumPosts_decorators = [(0, common_1.Get)('forum')];
        _getForumPostById_decorators = [(0, common_1.Get)('forum/:id')];
        _createForumPost_decorators = [(0, common_1.Post)('forum'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _createForumComment_decorators = [(0, common_1.Post)('forum/:id/comments'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _likeForumComment_decorators = [(0, common_1.Post)('forum/comments/:id/like'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _likeForumPost_decorators = [(0, common_1.Post)('forum/:id/like'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _shareForumPost_decorators = [(0, common_1.Post)('forum/:id/share'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _requestMentorOTP_decorators = [(0, common_1.Post)('mentor/request-otp')];
        _verifyMentorOTP_decorators = [(0, common_1.Post)('mentor/verify-otp')];
        _getMentorProfile_decorators = [(0, common_1.Get)('mentor/profile/:id')];
        _getMentorBookings_decorators = [(0, common_1.Get)('mentor/:id/bookings')];
        _updateBookingStatus_decorators = [(0, common_1.Put)('mentor/:mentorId/bookings/:bookingId')];
        _updateMentorProfile_decorators = [(0, common_1.Put)('mentor/:id/profile')];
        __esDecorate(_classThis, null, _getAllMentors_decorators, { kind: "method", name: "getAllMentors", static: false, private: false, access: { has: function (obj) { return "getAllMentors" in obj; }, get: function (obj) { return obj.getAllMentors; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFeaturedMentors_decorators, { kind: "method", name: "getFeaturedMentors", static: false, private: false, access: { has: function (obj) { return "getFeaturedMentors" in obj; }, get: function (obj) { return obj.getFeaturedMentors; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMentorById_decorators, { kind: "method", name: "getMentorById", static: false, private: false, access: { has: function (obj) { return "getMentorById" in obj; }, get: function (obj) { return obj.getMentorById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bookMentorSession_decorators, { kind: "method", name: "bookMentorSession", static: false, private: false, access: { has: function (obj) { return "bookMentorSession" in obj; }, get: function (obj) { return obj.bookMentorSession; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _applyAsMentor_decorators, { kind: "method", name: "applyAsMentor", static: false, private: false, access: { has: function (obj) { return "applyAsMentor" in obj; }, get: function (obj) { return obj.applyAsMentor; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMentorStats_decorators, { kind: "method", name: "getMentorStats", static: false, private: false, access: { has: function (obj) { return "getMentorStats" in obj; }, get: function (obj) { return obj.getMentorStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllEvents_decorators, { kind: "method", name: "getAllEvents", static: false, private: false, access: { has: function (obj) { return "getAllEvents" in obj; }, get: function (obj) { return obj.getAllEvents; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUpcomingEvents_decorators, { kind: "method", name: "getUpcomingEvents", static: false, private: false, access: { has: function (obj) { return "getUpcomingEvents" in obj; }, get: function (obj) { return obj.getUpcomingEvents; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPastEvents_decorators, { kind: "method", name: "getPastEvents", static: false, private: false, access: { has: function (obj) { return "getPastEvents" in obj; }, get: function (obj) { return obj.getPastEvents; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getEventById_decorators, { kind: "method", name: "getEventById", static: false, private: false, access: { has: function (obj) { return "getEventById" in obj; }, get: function (obj) { return obj.getEventById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _registerForEvent_decorators, { kind: "method", name: "registerForEvent", static: false, private: false, access: { has: function (obj) { return "registerForEvent" in obj; }, get: function (obj) { return obj.registerForEvent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllStories_decorators, { kind: "method", name: "getAllStories", static: false, private: false, access: { has: function (obj) { return "getAllStories" in obj; }, get: function (obj) { return obj.getAllStories; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFeaturedStories_decorators, { kind: "method", name: "getFeaturedStories", static: false, private: false, access: { has: function (obj) { return "getFeaturedStories" in obj; }, get: function (obj) { return obj.getFeaturedStories; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStoryById_decorators, { kind: "method", name: "getStoryById", static: false, private: false, access: { has: function (obj) { return "getStoryById" in obj; }, get: function (obj) { return obj.getStoryById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitStory_decorators, { kind: "method", name: "submitStory", static: false, private: false, access: { has: function (obj) { return "submitStory" in obj; }, get: function (obj) { return obj.submitStory; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllResources_decorators, { kind: "method", name: "getAllResources", static: false, private: false, access: { has: function (obj) { return "getAllResources" in obj; }, get: function (obj) { return obj.getAllResources; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPopularResources_decorators, { kind: "method", name: "getPopularResources", static: false, private: false, access: { has: function (obj) { return "getPopularResources" in obj; }, get: function (obj) { return obj.getPopularResources; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getResourceById_decorators, { kind: "method", name: "getResourceById", static: false, private: false, access: { has: function (obj) { return "getResourceById" in obj; }, get: function (obj) { return obj.getResourceById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _trackResourceView_decorators, { kind: "method", name: "trackResourceView", static: false, private: false, access: { has: function (obj) { return "trackResourceView" in obj; }, get: function (obj) { return obj.trackResourceView; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createMentor_decorators, { kind: "method", name: "createMentor", static: false, private: false, access: { has: function (obj) { return "createMentor" in obj; }, get: function (obj) { return obj.createMentor; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateMentor_decorators, { kind: "method", name: "updateMentor", static: false, private: false, access: { has: function (obj) { return "updateMentor" in obj; }, get: function (obj) { return obj.updateMentor; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteMentor_decorators, { kind: "method", name: "deleteMentor", static: false, private: false, access: { has: function (obj) { return "deleteMentor" in obj; }, get: function (obj) { return obj.deleteMentor; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createEvent_decorators, { kind: "method", name: "createEvent", static: false, private: false, access: { has: function (obj) { return "createEvent" in obj; }, get: function (obj) { return obj.createEvent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateEvent_decorators, { kind: "method", name: "updateEvent", static: false, private: false, access: { has: function (obj) { return "updateEvent" in obj; }, get: function (obj) { return obj.updateEvent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteEvent_decorators, { kind: "method", name: "deleteEvent", static: false, private: false, access: { has: function (obj) { return "deleteEvent" in obj; }, get: function (obj) { return obj.deleteEvent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createResource_decorators, { kind: "method", name: "createResource", static: false, private: false, access: { has: function (obj) { return "createResource" in obj; }, get: function (obj) { return obj.createResource; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateResource_decorators, { kind: "method", name: "updateResource", static: false, private: false, access: { has: function (obj) { return "updateResource" in obj; }, get: function (obj) { return obj.updateResource; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteResource_decorators, { kind: "method", name: "deleteResource", static: false, private: false, access: { has: function (obj) { return "deleteResource" in obj; }, get: function (obj) { return obj.deleteResource; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approveMentor_decorators, { kind: "method", name: "approveMentor", static: false, private: false, access: { has: function (obj) { return "approveMentor" in obj; }, get: function (obj) { return obj.approveMentor; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approveStory_decorators, { kind: "method", name: "approveStory", static: false, private: false, access: { has: function (obj) { return "approveStory" in obj; }, get: function (obj) { return obj.approveStory; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllBookings_decorators, { kind: "method", name: "getAllBookings", static: false, private: false, access: { has: function (obj) { return "getAllBookings" in obj; }, get: function (obj) { return obj.getAllBookings; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllRegistrations_decorators, { kind: "method", name: "getAllRegistrations", static: false, private: false, access: { has: function (obj) { return "getAllRegistrations" in obj; }, get: function (obj) { return obj.getAllRegistrations; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCommunityStats_decorators, { kind: "method", name: "getCommunityStats", static: false, private: false, access: { has: function (obj) { return "getCommunityStats" in obj; }, get: function (obj) { return obj.getCommunityStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllForumPosts_decorators, { kind: "method", name: "getAllForumPosts", static: false, private: false, access: { has: function (obj) { return "getAllForumPosts" in obj; }, get: function (obj) { return obj.getAllForumPosts; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getForumPostById_decorators, { kind: "method", name: "getForumPostById", static: false, private: false, access: { has: function (obj) { return "getForumPostById" in obj; }, get: function (obj) { return obj.getForumPostById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createForumPost_decorators, { kind: "method", name: "createForumPost", static: false, private: false, access: { has: function (obj) { return "createForumPost" in obj; }, get: function (obj) { return obj.createForumPost; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createForumComment_decorators, { kind: "method", name: "createForumComment", static: false, private: false, access: { has: function (obj) { return "createForumComment" in obj; }, get: function (obj) { return obj.createForumComment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _likeForumComment_decorators, { kind: "method", name: "likeForumComment", static: false, private: false, access: { has: function (obj) { return "likeForumComment" in obj; }, get: function (obj) { return obj.likeForumComment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _likeForumPost_decorators, { kind: "method", name: "likeForumPost", static: false, private: false, access: { has: function (obj) { return "likeForumPost" in obj; }, get: function (obj) { return obj.likeForumPost; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _shareForumPost_decorators, { kind: "method", name: "shareForumPost", static: false, private: false, access: { has: function (obj) { return "shareForumPost" in obj; }, get: function (obj) { return obj.shareForumPost; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _requestMentorOTP_decorators, { kind: "method", name: "requestMentorOTP", static: false, private: false, access: { has: function (obj) { return "requestMentorOTP" in obj; }, get: function (obj) { return obj.requestMentorOTP; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyMentorOTP_decorators, { kind: "method", name: "verifyMentorOTP", static: false, private: false, access: { has: function (obj) { return "verifyMentorOTP" in obj; }, get: function (obj) { return obj.verifyMentorOTP; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMentorProfile_decorators, { kind: "method", name: "getMentorProfile", static: false, private: false, access: { has: function (obj) { return "getMentorProfile" in obj; }, get: function (obj) { return obj.getMentorProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMentorBookings_decorators, { kind: "method", name: "getMentorBookings", static: false, private: false, access: { has: function (obj) { return "getMentorBookings" in obj; }, get: function (obj) { return obj.getMentorBookings; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateBookingStatus_decorators, { kind: "method", name: "updateBookingStatus", static: false, private: false, access: { has: function (obj) { return "updateBookingStatus" in obj; }, get: function (obj) { return obj.updateBookingStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateMentorProfile_decorators, { kind: "method", name: "updateMentorProfile", static: false, private: false, access: { has: function (obj) { return "updateMentorProfile" in obj; }, get: function (obj) { return obj.updateMentorProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CommunityController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CommunityController = _classThis;
}();
exports.CommunityController = CommunityController;

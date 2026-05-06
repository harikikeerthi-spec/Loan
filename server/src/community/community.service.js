"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var crypto_1 = require("crypto");
var CommunityService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CommunityService = _classThis = /** @class */ (function () {
        function CommunityService_1(prisma) {
            this.prisma = prisma;
            // ==================== MENTOR AUTH & DASHBOARD METHODS ====================
            // In-memory OTP storage (in production, use Redis or database)
            this.otpStore = new Map();
        }
        // ==================== MENTORSHIP METHODS ====================
        CommunityService_1.prototype.getAllMentors = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var university, country, loanType, category, limit, offset, where, _a, mentors, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            university = filters.university, country = filters.country, loanType = filters.loanType, category = filters.category, limit = filters.limit, offset = filters.offset;
                            where = { isActive: true, isApproved: true };
                            if (university) {
                                where.university = { contains: university, mode: 'insensitive' };
                            }
                            if (country) {
                                where.country = { contains: country, mode: 'insensitive' };
                            }
                            if (loanType) {
                                where.loanType = { contains: loanType, mode: 'insensitive' };
                            }
                            if (category) {
                                where.category = { contains: category, mode: 'insensitive' };
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.mentor.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        orderBy: [{ rating: 'desc' }, { studentsMentored: 'desc' }],
                                    }),
                                    this.prisma.mentor.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), mentors = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: mentors,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + mentors.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getFeaturedMentors = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                var mentors;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.findMany({
                                where: {
                                    isActive: true,
                                    isApproved: true,
                                    rating: { gte: 4.5 },
                                },
                                take: limit,
                                orderBy: [{ rating: 'desc' }, { studentsMentored: 'desc' }],
                            })];
                        case 1:
                            mentors = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: mentors,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getMentorById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var mentor;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            mentor = _a.sent();
                            if (!mentor) {
                                throw new common_1.NotFoundException('Mentor not found');
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    data: mentor,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.bookMentorSession = function (mentorId, bookingData) {
            return __awaiter(this, void 0, void 0, function () {
                var mentor, booking;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.findUnique({
                                where: { id: mentorId },
                            })];
                        case 1:
                            mentor = _a.sent();
                            if (!mentor) {
                                throw new common_1.NotFoundException('Mentor not found');
                            }
                            if (!mentor.isActive) {
                                throw new common_1.BadRequestException('Mentor is not currently accepting bookings');
                            }
                            return [4 /*yield*/, this.prisma.mentorBooking.create({
                                    data: __assign(__assign({ mentorId: mentorId }, bookingData), { status: 'pending' }),
                                })];
                        case 2:
                            booking = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Booking request submitted successfully',
                                    data: booking,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.applyAsMentor = function (applicationData) {
            return __awaiter(this, void 0, void 0, function () {
                var existingMentor, mentor;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Validate required fields
                            if (!applicationData || !applicationData.email) {
                                throw new common_1.BadRequestException('Email is required');
                            }
                            if (!applicationData.name) {
                                throw new common_1.BadRequestException('Name is required');
                            }
                            if (!applicationData.university) {
                                throw new common_1.BadRequestException('University is required');
                            }
                            if (!applicationData.country) {
                                throw new common_1.BadRequestException('Country is required');
                            }
                            return [4 /*yield*/, this.prisma.mentor.findUnique({
                                    where: { email: applicationData.email },
                                })];
                        case 1:
                            existingMentor = _a.sent();
                            if (existingMentor) {
                                throw new common_1.BadRequestException('A mentor with this email already exists');
                            }
                            return [4 /*yield*/, this.prisma.mentor.create({
                                    data: {
                                        name: applicationData.name,
                                        email: applicationData.email,
                                        phone: applicationData.phone || null,
                                        university: applicationData.university,
                                        degree: applicationData.degree || '',
                                        country: applicationData.country,
                                        loanBank: applicationData.loanBank || '',
                                        loanAmount: applicationData.loanAmount || '',
                                        interestRate: applicationData.interestRate || null,
                                        loanType: applicationData.loanType || null,
                                        category: applicationData.category || null,
                                        bio: applicationData.bio || '',
                                        expertise: applicationData.expertise || [],
                                        linkedIn: applicationData.linkedIn || null,
                                        image: applicationData.image || null,
                                        isActive: false,
                                        isApproved: false,
                                        rating: 0,
                                        studentsMentored: 0,
                                    },
                                })];
                        case 2:
                            mentor = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Mentor application submitted successfully. We will review and get back to you soon.',
                                    data: mentor,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getMentorStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, total, active, averageRating, totalMentored;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.mentor.count({ where: { isApproved: true } }),
                                this.prisma.mentor.count({ where: { isActive: true, isApproved: true } }),
                                this.prisma.mentor.aggregate({
                                    where: { isApproved: true },
                                    _avg: { rating: true },
                                }),
                            ])];
                        case 1:
                            _a = _b.sent(), total = _a[0], active = _a[1], averageRating = _a[2];
                            return [4 /*yield*/, this.prisma.mentor.aggregate({
                                    where: { isApproved: true },
                                    _sum: { studentsMentored: true },
                                })];
                        case 2:
                            totalMentored = _b.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: {
                                        totalMentors: total,
                                        activeMentors: active,
                                        averageRating: averageRating._avg.rating || 0,
                                        totalStudentsMentored: totalMentored._sum.studentsMentored || 0,
                                    },
                                }];
                    }
                });
            });
        };
        // ==================== EVENTS METHODS ====================
        CommunityService_1.prototype.getAllEvents = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var type, category, featured, limit, offset, where, _a, events, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            type = filters.type, category = filters.category, featured = filters.featured, limit = filters.limit, offset = filters.offset;
                            where = {};
                            if (type) {
                                where.type = type;
                            }
                            if (category) {
                                where.category = category;
                            }
                            if (featured !== undefined) {
                                where.isFeatured = featured;
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.communityEvent.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        orderBy: { date: 'asc' },
                                    }),
                                    this.prisma.communityEvent.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), events = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: events,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + events.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getUpcomingEvents = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                var now, events;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            now = new Date();
                            return [4 /*yield*/, this.prisma.communityEvent.findMany({
                                    where: {
                                        date: { gte: now.toISOString() },
                                    },
                                    take: limit,
                                    orderBy: { date: 'asc' },
                                })];
                        case 1:
                            events = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: events,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getPastEvents = function (limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                var now, _a, events, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            now = new Date();
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.communityEvent.findMany({
                                        where: {
                                            date: { lt: now.toISOString() },
                                        },
                                        take: limit,
                                        skip: offset,
                                        orderBy: { date: 'desc' },
                                    }),
                                    this.prisma.communityEvent.count({
                                        where: { date: { lt: now.toISOString() } },
                                    }),
                                ])];
                        case 1:
                            _a = _b.sent(), events = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: events,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + events.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getEventById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var event;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityEvent.findUnique({
                                where: { id: id },
                                include: {
                                    _count: {
                                        select: { registrations: true },
                                    },
                                },
                            })];
                        case 1:
                            event = _a.sent();
                            if (!event) {
                                throw new common_1.NotFoundException('Event not found');
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    data: __assign(__assign({}, event), { registeredCount: event._count.registrations }),
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.registerForEvent = function (eventId, registrationData) {
            return __awaiter(this, void 0, void 0, function () {
                var event, existingRegistration, registration;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityEvent.findUnique({
                                where: { id: eventId },
                                include: {
                                    _count: {
                                        select: { registrations: true },
                                    },
                                },
                            })];
                        case 1:
                            event = _a.sent();
                            if (!event) {
                                throw new common_1.NotFoundException('Event not found');
                            }
                            // Check if event is in the past
                            if (new Date(event.date) < new Date()) {
                                throw new common_1.BadRequestException('Cannot register for past events');
                            }
                            // Check if event is full
                            if (event.maxAttendees &&
                                event._count.registrations >= event.maxAttendees) {
                                throw new common_1.BadRequestException('Event is full');
                            }
                            return [4 /*yield*/, this.prisma.eventRegistration.findFirst({
                                    where: {
                                        eventId: eventId,
                                        email: registrationData.email,
                                    },
                                })];
                        case 2:
                            existingRegistration = _a.sent();
                            if (existingRegistration) {
                                throw new common_1.BadRequestException('You are already registered for this event');
                            }
                            return [4 /*yield*/, this.prisma.eventRegistration.create({
                                    data: __assign({ eventId: eventId }, registrationData),
                                })];
                        case 3:
                            registration = _a.sent();
                            // Update attendees count
                            return [4 /*yield*/, this.prisma.communityEvent.update({
                                    where: { id: eventId },
                                    data: {
                                        attendeesCount: { increment: 1 },
                                    },
                                })];
                        case 4:
                            // Update attendees count
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Successfully registered for the event',
                                    data: registration,
                                }];
                    }
                });
            });
        };
        // ==================== SUCCESS STORIES METHODS ====================
        CommunityService_1.prototype.getAllStories = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var country, category, limit, offset, where, _a, stories, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            country = filters.country, category = filters.category, limit = filters.limit, offset = filters.offset;
                            where = { isApproved: true };
                            if (country) {
                                where.country = { contains: country, mode: 'insensitive' };
                            }
                            if (category) {
                                where.category = { contains: category, mode: 'insensitive' };
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.successStory.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        orderBy: { createdAt: 'desc' },
                                    }),
                                    this.prisma.successStory.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), stories = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: stories,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + stories.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getFeaturedStories = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                var stories;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.successStory.findMany({
                                where: {
                                    isApproved: true,
                                    isFeatured: true,
                                },
                                take: limit,
                                orderBy: { createdAt: 'desc' },
                            })];
                        case 1:
                            stories = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: stories,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getStoryById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var story;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.successStory.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            story = _a.sent();
                            if (!story) {
                                throw new common_1.NotFoundException('Story not found');
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    data: story,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.submitStory = function (storyData) {
            return __awaiter(this, void 0, void 0, function () {
                var story;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.successStory.create({
                                data: __assign(__assign({}, storyData), { isApproved: false, isFeatured: false }),
                            })];
                        case 1:
                            story = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Success story submitted successfully. We will review and publish it soon.',
                                    data: story,
                                }];
                    }
                });
            });
        };
        // ==================== RESOURCES METHODS ====================
        CommunityService_1.prototype.getAllResources = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var type, category, limit, offset, where, _a, resources, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            type = filters.type, category = filters.category, limit = filters.limit, offset = filters.offset;
                            where = {};
                            if (type) {
                                where.type = type;
                            }
                            if (category) {
                                where.category = { contains: category, mode: 'insensitive' };
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.communityResource.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        orderBy: { createdAt: 'desc' },
                                    }),
                                    this.prisma.communityResource.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), resources = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: resources,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + resources.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getPopularResources = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                var resources;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityResource.findMany({
                                take: limit,
                                orderBy: { downloads: 'desc' },
                            })];
                        case 1:
                            resources = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: resources,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getResourceById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var resource;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityResource.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            resource = _a.sent();
                            if (!resource) {
                                throw new common_1.NotFoundException('Resource not found');
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    data: resource,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.trackResourceView = function (resourceId) {
            return __awaiter(this, void 0, void 0, function () {
                var resource;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityResource.update({
                                where: { id: resourceId },
                                data: {
                                    downloads: { increment: 1 },
                                },
                            })];
                        case 1:
                            resource = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: { downloads: resource.downloads },
                                }];
                    }
                });
            });
        };
        // ==================== ADMIN METHODS ====================
        CommunityService_1.prototype.createMentor = function (mentorData) {
            return __awaiter(this, void 0, void 0, function () {
                var mentor;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.create({
                                data: __assign(__assign({}, mentorData), { expertise: mentorData.expertise || [], isActive: mentorData.isActive !== undefined ? mentorData.isActive : true, isApproved: true, rating: mentorData.rating || 0, studentsMentored: mentorData.studentsMentored || 0 }),
                            })];
                        case 1:
                            mentor = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Mentor created successfully',
                                    data: mentor,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.updateMentor = function (id, updateData) {
            return __awaiter(this, void 0, void 0, function () {
                var mentor;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.update({
                                where: { id: id },
                                data: updateData,
                            })];
                        case 1:
                            mentor = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Mentor updated successfully',
                                    data: mentor,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.deleteMentor = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.delete({
                                where: { id: id },
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Mentor deleted successfully',
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.createEvent = function (eventData) {
            return __awaiter(this, void 0, void 0, function () {
                var event;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityEvent.create({
                                data: __assign(__assign({}, eventData), { attendeesCount: 0, isFeatured: eventData.isFeatured || false }),
                            })];
                        case 1:
                            event = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Event created successfully',
                                    data: event,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.updateEvent = function (id, updateData) {
            return __awaiter(this, void 0, void 0, function () {
                var event;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityEvent.update({
                                where: { id: id },
                                data: updateData,
                            })];
                        case 1:
                            event = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Event updated successfully',
                                    data: event,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.deleteEvent = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityEvent.delete({
                                where: { id: id },
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Event deleted successfully',
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.createResource = function (resourceData) {
            return __awaiter(this, void 0, void 0, function () {
                var resource;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityResource.create({
                                data: __assign(__assign({}, resourceData), { downloads: 0, isFeatured: resourceData.isFeatured || false }),
                            })];
                        case 1:
                            resource = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Resource created successfully',
                                    data: resource,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.updateResource = function (id, updateData) {
            return __awaiter(this, void 0, void 0, function () {
                var resource;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityResource.update({
                                where: { id: id },
                                data: updateData,
                            })];
                        case 1:
                            resource = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Resource updated successfully',
                                    data: resource,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.deleteResource = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.communityResource.delete({
                                where: { id: id },
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Resource deleted successfully',
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.approveMentor = function (id, approved, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var mentor;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.update({
                                where: { id: id },
                                data: {
                                    isApproved: approved,
                                    isActive: approved,
                                    rejectionReason: approved ? null : reason,
                                },
                            })];
                        case 1:
                            mentor = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: approved ? 'Mentor approved' : 'Mentor rejected',
                                    data: mentor,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.approveStory = function (id, approved, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var story;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.successStory.update({
                                where: { id: id },
                                data: {
                                    isApproved: approved,
                                    rejectionReason: approved ? null : reason,
                                },
                            })];
                        case 1:
                            story = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: approved ? 'Story approved' : 'Story rejected',
                                    data: story,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getAllBookings = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var status, mentorId, limit, offset, where, _a, bookings, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            status = filters.status, mentorId = filters.mentorId, limit = filters.limit, offset = filters.offset;
                            where = {};
                            if (status) {
                                where.status = status;
                            }
                            if (mentorId) {
                                where.mentorId = mentorId;
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.mentorBooking.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        include: {
                                            mentor: {
                                                select: {
                                                    name: true,
                                                    email: true,
                                                    university: true,
                                                },
                                            },
                                        },
                                        orderBy: { createdAt: 'desc' },
                                    }),
                                    this.prisma.mentorBooking.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), bookings = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: bookings,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + bookings.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getAllRegistrations = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var eventId, limit, offset, where, _a, registrations, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            eventId = filters.eventId, limit = filters.limit, offset = filters.offset;
                            where = {};
                            if (eventId) {
                                where.eventId = eventId;
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.eventRegistration.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        include: {
                                            event: {
                                                select: {
                                                    title: true,
                                                    date: true,
                                                    type: true,
                                                },
                                            },
                                        },
                                        orderBy: { createdAt: 'desc' },
                                    }),
                                    this.prisma.eventRegistration.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), registrations = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: registrations,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + registrations.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getCommunityStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, mentorCount, eventCount, storyCount, resourceCount, bookingCount, registrationCount;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.mentor.count({ where: { isApproved: true } }),
                                this.prisma.communityEvent.count(),
                                this.prisma.successStory.count({ where: { isApproved: true } }),
                                this.prisma.communityResource.count(),
                                this.prisma.mentorBooking.count(),
                                this.prisma.eventRegistration.count(),
                            ])];
                        case 1:
                            _a = _b.sent(), mentorCount = _a[0], eventCount = _a[1], storyCount = _a[2], resourceCount = _a[3], bookingCount = _a[4], registrationCount = _a[5];
                            return [2 /*return*/, {
                                    success: true,
                                    data: {
                                        mentors: mentorCount,
                                        events: eventCount,
                                        stories: storyCount,
                                        resources: resourceCount,
                                        bookings: bookingCount,
                                        registrations: registrationCount,
                                    },
                                }];
                    }
                });
            });
        };
        // ==================== FORUM/TOPIC METHODS ====================
        CommunityService_1.prototype.getForumPosts = function (filters, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var category, tag, limit, offset, sort, where, orderBy, _a, posts, total, likedPostIds, userLikes, e_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            category = filters.category, tag = filters.tag, limit = filters.limit, offset = filters.offset, sort = filters.sort;
                            where = {};
                            if (category) {
                                where.category = { equals: category, mode: 'insensitive' };
                            }
                            if (tag) {
                                where.tags = { has: tag };
                            }
                            orderBy = sort === 'popular' ? { likes: 'desc' } : { createdAt: 'desc' };
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.forumPost.findMany({
                                        where: where,
                                        include: {
                                            author: {
                                                select: {
                                                    firstName: true,
                                                    lastName: true,
                                                    role: true,
                                                },
                                            },
                                            _count: {
                                                select: { comments: true },
                                            },
                                        },
                                        take: limit,
                                        skip: offset,
                                        orderBy: orderBy,
                                    }),
                                    this.prisma.forumPost.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), posts = _a[0], total = _a[1];
                            likedPostIds = new Set();
                            if (!(userId && posts.length > 0)) return [3 /*break*/, 5];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n                    SELECT \"postId\" FROM \"PostLike\" \n                    WHERE \"userId\" = ", " \n                    AND \"postId\" IN (", ")\n                "], ["\n                    SELECT \"postId\" FROM \"PostLike\" \n                    WHERE \"userId\" = ", " \n                    AND \"postId\" IN (", ")\n                "])), userId, client_1.Prisma.join(posts.map(function (p) { return p.id; })))];
                        case 3:
                            userLikes = _b.sent();
                            likedPostIds = new Set(userLikes.map(function (l) { return l.postId; }));
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _b.sent();
                            console.error('Failed to fetch likes via raw query:', e_1);
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/, {
                                success: true,
                                data: posts.map(function (post) { return (__assign(__assign({}, post), { commentCount: post._count.comments, liked: likedPostIds.has(post.id) })); }),
                                pagination: {
                                    total: total,
                                    limit: limit,
                                    offset: offset,
                                    hasMore: offset + posts.length < total,
                                },
                            }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getForumPostById = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var post, liked, likedCommentIds, postLikes, allCommentIds_1, commentLikes, e_2, commentsWithLikes;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.forumPost.findUnique({
                                where: { id: id },
                                include: {
                                    author: {
                                        select: {
                                            firstName: true,
                                            lastName: true,
                                            id: true,
                                            role: true,
                                        },
                                    },
                                    comments: {
                                        where: { parentId: null },
                                        include: {
                                            author: {
                                                select: {
                                                    firstName: true,
                                                    lastName: true,
                                                    id: true,
                                                    role: true,
                                                },
                                            },
                                            replies: {
                                                include: {
                                                    author: {
                                                        select: {
                                                            firstName: true,
                                                            lastName: true,
                                                            id: true,
                                                            role: true,
                                                        },
                                                    },
                                                },
                                                orderBy: { createdAt: 'asc' },
                                            },
                                        },
                                        orderBy: { createdAt: 'asc' },
                                    },
                                    _count: {
                                        select: { comments: true },
                                    },
                                },
                            })];
                        case 1:
                            post = _a.sent();
                            if (!post)
                                throw new common_1.NotFoundException('Post not found');
                            // Increment views
                            return [4 /*yield*/, this.prisma.forumPost.update({
                                    where: { id: id },
                                    data: { views: { increment: 1 } },
                                })];
                        case 2:
                            // Increment views
                            _a.sent();
                            liked = false;
                            likedCommentIds = new Set();
                            if (!userId) return [3 /*break*/, 8];
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 7, , 8]);
                            return [4 /*yield*/, this.prisma.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n                    SELECT * FROM \"PostLike\" WHERE \"postId\" = ", " AND \"userId\" = ", " LIMIT 1\n                "], ["\n                    SELECT * FROM \"PostLike\" WHERE \"postId\" = ", " AND \"userId\" = ", " LIMIT 1\n                "])), id, userId)];
                        case 4:
                            postLikes = _a.sent();
                            liked = postLikes.length > 0;
                            allCommentIds_1 = [];
                            post.comments.forEach(function (c) {
                                allCommentIds_1.push(c.id);
                                if (c.replies)
                                    c.replies.forEach(function (r) { return allCommentIds_1.push(r.id); });
                            });
                            if (!(allCommentIds_1.length > 0)) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.prisma.$queryRaw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n                        SELECT \"commentId\" FROM \"ForumCommentLike\" \n                        WHERE \"userId\" = ", " \n                        AND \"commentId\" IN (", ")\n                    "], ["\n                        SELECT \"commentId\" FROM \"ForumCommentLike\" \n                        WHERE \"userId\" = ", " \n                        AND \"commentId\" IN (", ")\n                    "])), userId, client_1.Prisma.join(allCommentIds_1))];
                        case 5:
                            commentLikes = _a.sent();
                            commentLikes.forEach(function (l) { return likedCommentIds.add(l.commentId); });
                            _a.label = 6;
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            e_2 = _a.sent();
                            console.error('Failed to fetch likes via raw query:', e_2);
                            return [3 /*break*/, 8];
                        case 8:
                            commentsWithLikes = post.comments.map(function (c) { return (__assign(__assign({}, c), { liked: likedCommentIds.has(c.id), replies: c.replies.map(function (r) { return (__assign(__assign({}, r), { liked: likedCommentIds.has(r.id) })); }) })); });
                            return [2 /*return*/, {
                                    success: true,
                                    data: __assign(__assign({}, post), { comments: commentsWithLikes, liked: liked }),
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.createForumPost = function (userId, data) {
            return __awaiter(this, void 0, void 0, function () {
                var user, post;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({ where: { id: userId } })];
                        case 1:
                            user = _a.sent();
                            if (!user)
                                throw new common_1.NotFoundException('User not found');
                            return [4 /*yield*/, this.prisma.forumPost.create({
                                    data: {
                                        title: data.title,
                                        content: data.content,
                                        category: data.category,
                                        tags: data.tags || [],
                                        authorId: userId,
                                        isMentorOnly: data.isMentorOnly || false,
                                    },
                                    include: {
                                        author: {
                                            select: {
                                                firstName: true,
                                                lastName: true,
                                                role: true,
                                                id: true,
                                            },
                                        },
                                    },
                                })];
                        case 2:
                            post = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Post created successfully',
                                    data: post,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.createForumComment = function (userId, postId, content, parentId) {
            return __awaiter(this, void 0, void 0, function () {
                var post, comment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.forumPost.findUnique({
                                where: { id: postId },
                            })];
                        case 1:
                            post = _a.sent();
                            if (!post)
                                throw new common_1.NotFoundException('Post not found');
                            return [4 /*yield*/, this.prisma.forumComment.create({
                                    data: {
                                        content: content,
                                        postId: postId,
                                        authorId: userId,
                                        parentId: parentId || null,
                                    },
                                    include: {
                                        author: {
                                            select: { firstName: true, lastName: true, role: true },
                                        },
                                    },
                                })];
                        case 2:
                            comment = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Comment added successfully',
                                    data: comment,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.likeForumComment = function (userId, id) {
            return __awaiter(this, void 0, void 0, function () {
                var existingLikes, existingLike, updatedComment, newId, updatedComment, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 8, , 9]);
                            return [4 /*yield*/, this.prisma.$queryRaw(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n                SELECT id FROM \"ForumCommentLike\" \n                WHERE \"commentId\" = ", " AND \"userId\" = ", "\n                LIMIT 1\n            "], ["\n                SELECT id FROM \"ForumCommentLike\" \n                WHERE \"commentId\" = ", " AND \"userId\" = ", "\n                LIMIT 1\n            "])), id, userId)];
                        case 1:
                            existingLikes = _a.sent();
                            existingLike = existingLikes[0];
                            if (!existingLike) return [3 /*break*/, 4];
                            // Un-like: remove the like record and decrement count
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma
                                        .$executeRaw(templateObject_5 || (templateObject_5 = __makeTemplateObject(["DELETE FROM \"ForumCommentLike\" WHERE id = ", ""], ["DELETE FROM \"ForumCommentLike\" WHERE id = ", ""])), existingLike.id),
                                    this.prisma.forumComment.update({
                                        where: { id: id },
                                        data: { likes: { decrement: 1 } },
                                    }),
                                ])];
                        case 2:
                            // Un-like: remove the like record and decrement count
                            _a.sent();
                            return [4 /*yield*/, this.prisma.forumComment.findUnique({
                                    where: { id: id },
                                    select: { likes: true },
                                })];
                        case 3:
                            updatedComment = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    likes: (updatedComment === null || updatedComment === void 0 ? void 0 : updatedComment.likes) || 0,
                                    liked: false,
                                }];
                        case 4:
                            newId = (0, crypto_1.randomUUID)();
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.$executeRaw(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n                        INSERT INTO \"ForumCommentLike\" (id, \"commentId\", \"userId\", \"createdAt\") \n                        VALUES (", ", ", ", ", ", ", ")\n                    "], ["\n                        INSERT INTO \"ForumCommentLike\" (id, \"commentId\", \"userId\", \"createdAt\") \n                        VALUES (", ", ", ", ", ", ", ")\n                    "])), newId, id, userId, new Date()),
                                    this.prisma.forumComment.update({
                                        where: { id: id },
                                        data: { likes: { increment: 1 } },
                                    }),
                                ])];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.forumComment.findUnique({
                                    where: { id: id },
                                    select: { likes: true },
                                })];
                        case 6:
                            updatedComment = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    likes: (updatedComment === null || updatedComment === void 0 ? void 0 : updatedComment.likes) || 0,
                                    liked: true,
                                }];
                        case 7: return [3 /*break*/, 9];
                        case 8:
                            error_1 = _a.sent();
                            console.error('[CommunityService] likeForumComment failed:', error_1);
                            throw new common_1.BadRequestException('Failed to process like action on comment');
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        CommunityService_1.prototype.likeForumPost = function (userId, id) {
            return __awaiter(this, void 0, void 0, function () {
                var existingLikes, existingLike, updatedPost, newId, updatedPost, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("[CommunityService] likeForumPost called for user ".concat(userId, " and post ").concat(id));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 9, , 10]);
                            return [4 /*yield*/, this.prisma.$queryRaw(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n                SELECT id FROM \"PostLike\" \n                WHERE \"postId\" = ", " AND \"userId\" = ", "\n                LIMIT 1\n            "], ["\n                SELECT id FROM \"PostLike\" \n                WHERE \"postId\" = ", " AND \"userId\" = ", "\n                LIMIT 1\n            "])), id, userId)];
                        case 2:
                            existingLikes = _a.sent();
                            existingLike = existingLikes[0];
                            if (!existingLike) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma
                                        .$executeRaw(templateObject_8 || (templateObject_8 = __makeTemplateObject(["DELETE FROM \"PostLike\" WHERE id = ", ""], ["DELETE FROM \"PostLike\" WHERE id = ", ""])), existingLike.id),
                                    this.prisma.forumPost.update({
                                        where: { id: id },
                                        data: { likes: { decrement: 1 } },
                                    }),
                                ])];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.forumPost.findUnique({
                                    where: { id: id },
                                    select: { likes: true },
                                })];
                        case 4:
                            updatedPost = _a.sent();
                            return [2 /*return*/, { success: true, likes: (updatedPost === null || updatedPost === void 0 ? void 0 : updatedPost.likes) || 0, liked: false }];
                        case 5:
                            newId = (0, crypto_1.randomUUID)();
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.$executeRaw(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n                        INSERT INTO \"PostLike\" (id, \"postId\", \"userId\", \"createdAt\") \n                        VALUES (", ", ", ", ", ", ", ")\n                    "], ["\n                        INSERT INTO \"PostLike\" (id, \"postId\", \"userId\", \"createdAt\") \n                        VALUES (", ", ", ", ", ", ", ")\n                    "])), newId, id, userId, new Date()),
                                    this.prisma.forumPost.update({
                                        where: { id: id },
                                        data: { likes: { increment: 1 } },
                                    }),
                                ])];
                        case 6:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.forumPost.findUnique({
                                    where: { id: id },
                                    select: { likes: true },
                                })];
                        case 7:
                            updatedPost = _a.sent();
                            return [2 /*return*/, { success: true, likes: (updatedPost === null || updatedPost === void 0 ? void 0 : updatedPost.likes) || 0, liked: true }];
                        case 8: return [3 /*break*/, 10];
                        case 9:
                            error_2 = _a.sent();
                            console.error('[CommunityService] likeForumPost failed:', error_2);
                            throw new common_1.BadRequestException('Failed to process like action on post');
                        case 10: return [2 /*return*/];
                    }
                });
            });
        };
        CommunityService_1.prototype.shareForumPost = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.prisma.forumPost.update({
                                    where: { id: id },
                                    data: { views: { increment: 1 } },
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { success: true, message: 'Post shared' }];
                        case 2:
                            error_3 = _a.sent();
                            throw new common_1.NotFoundException('Post not found');
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CommunityService_1.prototype.requestMentorOTP = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                var mentor, otp, expiresAt;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.findUnique({
                                where: { email: email },
                            })];
                        case 1:
                            mentor = _a.sent();
                            if (!mentor) {
                                throw new common_1.NotFoundException('Mentor not found with this email');
                            }
                            if (!mentor.isApproved) {
                                throw new common_1.BadRequestException('Your mentor application is pending approval');
                            }
                            if (!mentor.isActive) {
                                throw new common_1.BadRequestException('Your mentor account is not active');
                            }
                            otp = Math.floor(100000 + Math.random() * 900000).toString();
                            expiresAt = new Date(Date.now() + 5 * 60 * 1000);
                            this.otpStore.set(email, { otp: otp, expiresAt: expiresAt });
                            // In production, send OTP via email service (SendGrid, AWS SES, etc.)
                            console.log("\n\uD83D\uDD10 OTP for ".concat(email, ": ").concat(otp, "\n"));
                            console.log("OTP expires at: ".concat(expiresAt.toLocaleTimeString(), "\n"));
                            // TODO: Send email with OTP
                            // await this.emailService.sendOTP(email, otp);
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'OTP sent to your email. Please check your inbox.',
                                    data: {
                                        email: email,
                                        expiresIn: 300, // seconds
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.verifyMentorOTP = function (email, otp) {
            return __awaiter(this, void 0, void 0, function () {
                var mentor, storedOTP;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.findUnique({
                                where: { email: email },
                            })];
                        case 1:
                            mentor = _a.sent();
                            if (!mentor) {
                                throw new common_1.NotFoundException('Mentor not found');
                            }
                            storedOTP = this.otpStore.get(email);
                            if (!storedOTP) {
                                throw new common_1.BadRequestException('OTP not found. Please request a new OTP.');
                            }
                            // Check if OTP is expired
                            if (new Date() > storedOTP.expiresAt) {
                                this.otpStore.delete(email);
                                throw new common_1.BadRequestException('OTP has expired. Please request a new OTP.');
                            }
                            // Verify OTP
                            if (storedOTP.otp !== otp) {
                                throw new common_1.BadRequestException('Invalid OTP. Please try again.');
                            }
                            // Clear OTP after successful verification
                            this.otpStore.delete(email);
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Login successful',
                                    data: {
                                        id: mentor.id,
                                        name: mentor.name,
                                        email: mentor.email,
                                        university: mentor.university,
                                        isApproved: mentor.isApproved,
                                        isActive: mentor.isActive,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getMentorProfile = function (mentorId) {
            return __awaiter(this, void 0, void 0, function () {
                var mentor, bookingStats, stats;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentor.findUnique({
                                where: { id: mentorId },
                            })];
                        case 1:
                            mentor = _a.sent();
                            if (!mentor) {
                                throw new common_1.NotFoundException('Mentor not found');
                            }
                            return [4 /*yield*/, this.prisma.mentorBooking.groupBy({
                                    by: ['status'],
                                    where: { mentorId: mentorId },
                                    _count: true,
                                })];
                        case 2:
                            bookingStats = _a.sent();
                            stats = {
                                total: 0,
                                pending: 0,
                                approved: 0,
                                rejected: 0,
                                completed: 0,
                            };
                            bookingStats.forEach(function (stat) {
                                stats.total += stat._count;
                                stats[stat.status] = stat._count;
                            });
                            return [2 /*return*/, {
                                    success: true,
                                    data: {
                                        mentor: mentor,
                                        stats: stats,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.getMentorBookings = function (mentorId, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var status, limit, offset, where, _a, bookings, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            status = filters.status, limit = filters.limit, offset = filters.offset;
                            where = { mentorId: mentorId };
                            if (status) {
                                where.status = status;
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.mentorBooking.findMany({
                                        where: where,
                                        take: limit || 20,
                                        skip: offset || 0,
                                        orderBy: { createdAt: 'desc' },
                                    }),
                                    this.prisma.mentorBooking.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), bookings = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: bookings,
                                    pagination: {
                                        total: total,
                                        limit: limit || 20,
                                        offset: offset || 0,
                                        hasMore: (offset || 0) + bookings.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.updateBookingStatus = function (mentorId, bookingId, status) {
            return __awaiter(this, void 0, void 0, function () {
                var booking, updatedBooking;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mentorBooking.findFirst({
                                where: {
                                    id: bookingId,
                                    mentorId: mentorId,
                                },
                            })];
                        case 1:
                            booking = _a.sent();
                            if (!booking) {
                                throw new common_1.NotFoundException('Booking not found or not authorized');
                            }
                            return [4 /*yield*/, this.prisma.mentorBooking.update({
                                    where: { id: bookingId },
                                    data: {
                                        status: status,
                                    },
                                })];
                        case 2:
                            updatedBooking = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: "Booking ".concat(status, " successfully"),
                                    data: updatedBooking,
                                }];
                    }
                });
            });
        };
        CommunityService_1.prototype.updateMentorProfile = function (mentorId, updateData) {
            return __awaiter(this, void 0, void 0, function () {
                var allowedFields, dataToUpdate, mentor;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            allowedFields = [
                                'phone',
                                'bio',
                                'expertise',
                                'linkedIn',
                                'image',
                                'isActive',
                            ];
                            dataToUpdate = {};
                            Object.keys(updateData).forEach(function (key) {
                                if (allowedFields.includes(key)) {
                                    dataToUpdate[key] = updateData[key];
                                }
                            });
                            return [4 /*yield*/, this.prisma.mentor.update({
                                    where: { id: mentorId },
                                    data: dataToUpdate,
                                })];
                        case 1:
                            mentor = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Profile updated successfully',
                                    data: mentor,
                                }];
                    }
                });
            });
        };
        return CommunityService_1;
    }());
    __setFunctionName(_classThis, "CommunityService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CommunityService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CommunityService = _classThis;
}();
exports.CommunityService = CommunityService;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;

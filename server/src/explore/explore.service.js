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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExploreService = void 0;
var common_1 = require("@nestjs/common");
var ExploreService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ExploreService = _classThis = /** @class */ (function () {
        function ExploreService_1(prisma, communityService, referenceService) {
            this.prisma = prisma;
            this.communityService = communityService;
            this.referenceService = referenceService;
            this.hubConfigs = {
                'loans': {
                    title: 'Loans & Finance',
                    badge: 'LOANS',
                    description: 'Interest rates, banks, eligibility, and EMI planning.',
                    advice: 'Get expert guidance on loan eligibility, documentation, and approval strategies.',
                    categories: ['loan', 'finance', 'eligibility'],
                    icon: 'payments'
                },
                'universities': {
                    title: 'Universities',
                    badge: 'UNIVERSITIES',
                    description: 'Country filters, rank insights, and university discussions.',
                    advice: 'Connect with alumni from top universities worldwide for insider perspectives.',
                    categories: ['university', 'admission', 'ranking'],
                    icon: 'school'
                },
                'courses': {
                    title: 'Courses',
                    badge: 'COURSES',
                    description: 'MS, MBA, PhD, and specialized international programs.',
                    advice: 'Get advice on course selection aligned with your career goals.',
                    categories: ['course', 'curriculum', 'career'],
                    icon: 'menu_book'
                },
                'stories': {
                    title: 'Success Stories',
                    badge: 'STORIES',
                    description: 'Real student journeys, mistakes, and triumph reports.',
                    advice: 'Read first-hand accounts of students who successfully moved abroad.',
                    categories: ['story', 'success'],
                    icon: 'lightbulb',
                    isSpecialRoute: true,
                    route: 'Success Stories'
                },
                'mentors': {
                    title: 'Alumni & Mentors',
                    badge: 'MENTORS',
                    description: 'Verified advisors and successful student mentors.',
                    advice: 'Book sessions with mentors who have actually walked the path.',
                    categories: ['mentor', 'alumni'],
                    icon: 'groups',
                    isSpecialRoute: true,
                    route: 'Alumni & Mentors'
                },
                'scholarships': {
                    title: 'Scholarships',
                    badge: 'SCHOLARSHIPS',
                    description: 'Deadlines, alerts, and matching tailored to your profile.',
                    advice: 'Learn from scholarship recipients about application strategies.',
                    categories: ['scholarship', 'funding', 'grant'],
                    icon: 'card_membership'
                },
                'accommodation': {
                    title: 'Accommodation',
                    badge: 'HOUSING',
                    description: 'Find housing, roommates, and local living tips.',
                    advice: 'Get practical advice on housing markets and safe neighborhoods.',
                    categories: ['accommodation', 'housing', 'living'],
                    icon: 'home'
                },
                'testprep': {
                    title: 'Test Preparation',
                    badge: 'TEST PREP',
                    description: 'GRE, IELTS, TOEFL, GMAT, and SAT strategies.',
                    advice: 'Learn from students who scored in the top percentiles.',
                    categories: ['testprep', 'gre', 'ielts', 'toefl'],
                    icon: 'edit_note'
                },
                'events': {
                    title: 'Events & AMAs',
                    badge: 'EVENTS',
                    description: 'Live sessions with banks, alumni, and industry experts.',
                    advice: 'Stay updated with upcoming webinars and expert sessions.',
                    categories: ['event', 'ama'],
                    icon: 'event',
                    isSpecialRoute: true,
                    route: 'Events & AMAs'
                },
                'visa': {
                    title: 'Visa Support',
                    badge: 'VISA',
                    description: 'Application guides, interview tips, and checklists.',
                    advice: 'Get insights on visa success stories and interview prep.',
                    categories: ['visa', 'immigration', 'interview'],
                    icon: 'flight'
                },
                'aitools': {
                    title: 'AI Tools',
                    badge: 'AI FEATURES',
                    description: 'AI SOP writer, admit predictor, and loan advisors.',
                    advice: 'Use our cutting-edge AI tools to streamline your journey.',
                    categories: ['ai', 'tools'],
                    icon: 'smart_toy'
                },
                'resources': {
                    title: 'Resources',
                    badge: 'RESOURCES',
                    description: 'Download free guides, checklists, and templates.',
                    advice: 'Access high-quality resources to help with your application.',
                    categories: ['resource', 'guide'],
                    icon: 'folder_open',
                    isSpecialRoute: true,
                    route: 'Resources'
                },
                'general': {
                    title: 'General Discussion',
                    badge: 'GENERAL',
                    description: 'Connect with the community on any topic related to your study abroad journey.',
                    advice: 'Connect with the community on diverse topics and share your unique experiences.',
                    categories: ['general', 'discussion'],
                    icon: 'forum',
                    isHidden: true
                }
            };
        }
        ExploreService_1.prototype._normalizeTopic = function (topic) {
            var normalized = topic.toLowerCase();
            if (normalized === 'loan' || normalized === 'loans' || normalized === 'eligibility')
                return 'loans';
            if (normalized === 'admission' || normalized === 'admissions' || normalized === 'university')
                return 'universities';
            if (normalized === 'course')
                return 'courses';
            if (normalized === 'gre' || normalized === 'ielts' || normalized === 'toefl')
                return 'testprep';
            return normalized;
        };
        ExploreService_1.prototype.getHubData = function (topic) {
            return __awaiter(this, void 0, void 0, function () {
                var targetTopic, config, _a, mentors, events, resources, stories, forumPosts, _b, activeMentorsCount, totalPostsCount;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            targetTopic = this._normalizeTopic(topic);
                            config = this.hubConfigs[targetTopic];
                            if (!config) {
                                throw new common_1.NotFoundException("Explore Hub for topic '".concat(topic, "' not found"));
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.communityService.getAllMentors({ category: targetTopic, limit: 3 }),
                                    this.communityService.getAllEvents({ category: targetTopic, limit: 3 }),
                                    this.communityService.getAllResources({ category: targetTopic, limit: 3 }),
                                    this.communityService.getAllStories({ category: targetTopic, limit: 3 }),
                                    this.communityService.getForumPosts({ category: targetTopic, limit: 5 })
                                ])];
                        case 1:
                            _a = _c.sent(), mentors = _a[0], events = _a[1], resources = _a[2], stories = _a[3], forumPosts = _a[4];
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.mentor.count({
                                        where: {
                                            category: { equals: targetTopic },
                                            isActive: true,
                                            isApproved: true
                                        }
                                    }),
                                    this.prisma.forumPost.count({
                                        where: {
                                            category: { equals: targetTopic }
                                        }
                                    })
                                ])];
                        case 2:
                            _b = _c.sent(), activeMentorsCount = _b[0], totalPostsCount = _b[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: {
                                        hub: {
                                            topic: targetTopic, // Return normalized topic
                                            originalTopic: topic,
                                            title: config.title,
                                            badge: config.badge,
                                            description: config.description,
                                            advice: config.advice,
                                            icon: config.icon,
                                            stats: {
                                                activeMentors: activeMentorsCount,
                                                discussions: totalPostsCount,
                                                members: totalPostsCount * 3 + activeMentorsCount // Simulated member count
                                            }
                                        },
                                        featuredMentorPost: config.featuredPost,
                                        mentors: mentors.data,
                                        events: events.data,
                                        resources: resources.data,
                                        stories: stories.data,
                                        forumPosts: forumPosts.data
                                    }
                                }];
                    }
                });
            });
        };
        ExploreService_1.prototype.getAllHubs = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, {
                            success: true,
                            data: Object.keys(this.hubConfigs)
                                .filter(function (key) { return !_this.hubConfigs[key].isHidden; })
                                .map(function (key) { return (__assign({ id: key }, _this.hubConfigs[key])); })
                        }];
                });
            });
        };
        ExploreService_1.prototype.getHubPosts = function (topic, sort, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var category;
                return __generator(this, function (_a) {
                    category = this._normalizeTopic(topic);
                    return [2 /*return*/, this.communityService.getForumPosts({
                            category: category,
                            sort: sort || 'newest',
                            limit: 20
                        }, userId)];
                });
            });
        };
        ExploreService_1.prototype.createHubPost = function (userId, topic, data) {
            return __awaiter(this, void 0, void 0, function () {
                var category, postData;
                return __generator(this, function (_a) {
                    category = this._normalizeTopic(topic);
                    postData = __assign(__assign({}, data), { category: category });
                    return [2 /*return*/, this.communityService.createForumPost(userId, postData)];
                });
            });
        };
        return ExploreService_1;
    }());
    __setFunctionName(_classThis, "ExploreService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ExploreService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ExploreService = _classThis;
}();
exports.ExploreService = ExploreService;

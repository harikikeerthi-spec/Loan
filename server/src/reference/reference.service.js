"use strict";
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
exports.ReferenceService = void 0;
var common_1 = require("@nestjs/common");
var ReferenceService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ReferenceService = _classThis = /** @class */ (function () {
        function ReferenceService_1(prisma) {
            this.prisma = prisma;
        }
        // ==================== LOAN TYPES ====================
        ReferenceService_1.prototype.getAllLoanTypes = function () {
            return __awaiter(this, void 0, void 0, function () {
                var loanTypes;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.loanType.findMany({
                                orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
                            })];
                        case 1:
                            loanTypes = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: loanTypes,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getPopularLoanTypes = function () {
            return __awaiter(this, void 0, void 0, function () {
                var loanTypes;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.loanType.findMany({
                                where: { isPopular: true },
                                orderBy: { name: 'asc' },
                            })];
                        case 1:
                            loanTypes = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: loanTypes,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getLoanTypeById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var loanType;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.loanType.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            loanType = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: loanType,
                                }];
                    }
                });
            });
        };
        // ==================== UNIVERSITIES ====================
        ReferenceService_1.prototype.getAllUniversities = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var country, ranking, limit, offset, where, _a, universities, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            country = filters.country, ranking = filters.ranking, limit = filters.limit, offset = filters.offset;
                            where = {};
                            if (country) {
                                where.country = { contains: country, mode: 'insensitive' };
                            }
                            if (ranking) {
                                where.ranking = { lte: parseInt(ranking) };
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.university.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        orderBy: [{ isFeatured: 'desc' }, { ranking: 'asc' }],
                                    }),
                                    this.prisma.university.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), universities = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: universities,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + universities.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getFeaturedUniversities = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                var universities;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.university.findMany({
                                where: { isFeatured: true },
                                take: limit,
                                orderBy: { ranking: 'asc' },
                            })];
                        case 1:
                            universities = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: universities,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getUniversityById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var university;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.university.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            university = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: university,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getUniversitiesByCountry = function (country) {
            return __awaiter(this, void 0, void 0, function () {
                var universities;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.university.findMany({
                                where: { country: { equals: country, mode: 'insensitive' } },
                                orderBy: { ranking: 'asc' },
                            })];
                        case 1:
                            universities = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: universities,
                                }];
                    }
                });
            });
        };
        // ==================== BANKS ====================
        ReferenceService_1.prototype.getAllBanks = function () {
            return __awaiter(this, void 0, void 0, function () {
                var banks;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.bank.findMany({
                                orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
                            })];
                        case 1:
                            banks = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: banks,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getPopularBanks = function () {
            return __awaiter(this, void 0, void 0, function () {
                var banks;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.bank.findMany({
                                where: { isPopular: true },
                                orderBy: { name: 'asc' },
                            })];
                        case 1:
                            banks = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: banks,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getBankById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var bank;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.bank.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            bank = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: bank,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getBanksByType = function (type) {
            return __awaiter(this, void 0, void 0, function () {
                var banks;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.bank.findMany({
                                where: { type: type },
                                orderBy: { name: 'asc' },
                            })];
                        case 1:
                            banks = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: banks,
                                }];
                    }
                });
            });
        };
        // ==================== COUNTRIES ====================
        ReferenceService_1.prototype.getAllCountries = function () {
            return __awaiter(this, void 0, void 0, function () {
                var countries;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.country.findMany({
                                orderBy: [{ popularForStudy: 'desc' }, { name: 'asc' }],
                            })];
                        case 1:
                            countries = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: countries,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getPopularCountries = function () {
            return __awaiter(this, void 0, void 0, function () {
                var countries;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.country.findMany({
                                where: { popularForStudy: true },
                                orderBy: { name: 'asc' },
                            })];
                        case 1:
                            countries = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: countries,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getCountryById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var country;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.country.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            country = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: country,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getCountryByCode = function (code) {
            return __awaiter(this, void 0, void 0, function () {
                var country;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.country.findUnique({
                                where: { code: code.toUpperCase() },
                            })];
                        case 1:
                            country = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: country,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getCountriesByRegion = function (region) {
            return __awaiter(this, void 0, void 0, function () {
                var countries;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.country.findMany({
                                where: { region: { contains: region, mode: 'insensitive' } },
                                orderBy: { name: 'asc' },
                            })];
                        case 1:
                            countries = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: countries,
                                }];
                    }
                });
            });
        };
        // ==================== SCHOLARSHIPS ====================
        ReferenceService_1.prototype.getAllScholarships = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var country, type, limit, offset, where, _a, scholarships, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            country = filters.country, type = filters.type, limit = filters.limit, offset = filters.offset;
                            where = { isActive: true };
                            if (country) {
                                where.country = { contains: country, mode: 'insensitive' };
                            }
                            if (type) {
                                where.type = type;
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.scholarship.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        orderBy: { createdAt: 'desc' },
                                    }),
                                    this.prisma.scholarship.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), scholarships = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: scholarships,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + scholarships.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getScholarshipById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var scholarship;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.scholarship.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            scholarship = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: scholarship,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getScholarshipsByCountry = function (country) {
            return __awaiter(this, void 0, void 0, function () {
                var scholarships;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.scholarship.findMany({
                                where: {
                                    country: { equals: country, mode: 'insensitive' },
                                    isActive: true,
                                },
                                orderBy: { createdAt: 'desc' },
                            })];
                        case 1:
                            scholarships = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: scholarships,
                                }];
                    }
                });
            });
        };
        // ==================== COURSES ====================
        ReferenceService_1.prototype.getAllCourses = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var level, field, limit, offset, where, _a, courses, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            level = filters.level, field = filters.field, limit = filters.limit, offset = filters.offset;
                            where = {};
                            if (level) {
                                where.level = { contains: level, mode: 'insensitive' };
                            }
                            if (field) {
                                where.field = { contains: field, mode: 'insensitive' };
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.course.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
                                    }),
                                    this.prisma.course.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), courses = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: courses,
                                    pagination: {
                                        total: total,
                                        limit: limit,
                                        offset: offset,
                                        hasMore: offset + courses.length < total,
                                    },
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getPopularCourses = function () {
            return __awaiter(this, void 0, void 0, function () {
                var courses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.course.findMany({
                                where: { isPopular: true },
                                orderBy: { name: 'asc' },
                            })];
                        case 1:
                            courses = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: courses,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getCourseById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var course;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.course.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            course = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: course,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getCoursesByLevel = function (level) {
            return __awaiter(this, void 0, void 0, function () {
                var courses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.course.findMany({
                                where: { level: { contains: level, mode: 'insensitive' } },
                                orderBy: { name: 'asc' },
                            })];
                        case 1:
                            courses = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: courses,
                                }];
                    }
                });
            });
        };
        ReferenceService_1.prototype.getCoursesByField = function (field) {
            return __awaiter(this, void 0, void 0, function () {
                var courses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.course.findMany({
                                where: { field: { contains: field, mode: 'insensitive' } },
                                orderBy: { name: 'asc' },
                            })];
                        case 1:
                            courses = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: courses,
                                }];
                    }
                });
            });
        };
        return ReferenceService_1;
    }());
    __setFunctionName(_classThis, "ReferenceService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReferenceService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReferenceService = _classThis;
}();
exports.ReferenceService = ReferenceService;

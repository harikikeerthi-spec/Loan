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
exports.ReferenceController = void 0;
var common_1 = require("@nestjs/common");
var ReferenceController = function () {
    var _classDecorators = [(0, common_1.Controller)('reference')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getAllLoanTypes_decorators;
    var _getPopularLoanTypes_decorators;
    var _getLoanTypeById_decorators;
    var _getAllUniversities_decorators;
    var _getFeaturedUniversities_decorators;
    var _getUniversityById_decorators;
    var _getUniversitiesByCountry_decorators;
    var _getAllBanks_decorators;
    var _getPopularBanks_decorators;
    var _getBankById_decorators;
    var _getBanksByType_decorators;
    var _getAllCountries_decorators;
    var _getPopularCountries_decorators;
    var _getCountryById_decorators;
    var _getCountryByCode_decorators;
    var _getCountriesByRegion_decorators;
    var _getAllScholarships_decorators;
    var _getScholarshipById_decorators;
    var _getScholarshipsByCountry_decorators;
    var _getAllCourses_decorators;
    var _getPopularCourses_decorators;
    var _getCourseById_decorators;
    var _getCoursesByLevel_decorators;
    var _getCoursesByField_decorators;
    var ReferenceController = _classThis = /** @class */ (function () {
        function ReferenceController_1(referenceService) {
            this.referenceService = (__runInitializers(this, _instanceExtraInitializers), referenceService);
        }
        // ==================== LOAN TYPES ====================
        /**
         * Get all loan types
         * GET /reference/loan-types
         */
        ReferenceController_1.prototype.getAllLoanTypes = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getAllLoanTypes()];
                });
            });
        };
        /**
         * Get popular loan types
         * GET /reference/loan-types/popular
         */
        ReferenceController_1.prototype.getPopularLoanTypes = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getPopularLoanTypes()];
                });
            });
        };
        /**
         * Get loan type by ID
         * GET /reference/loan-types/:id
         */
        ReferenceController_1.prototype.getLoanTypeById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getLoanTypeById(id)];
                });
            });
        };
        // ==================== UNIVERSITIES ====================
        /**
         * Get all universities with filters
         * GET /reference/universities
         * @query country - Filter by country
         * @query ranking - Filter by ranking (returns universities with ranking <= value)
         * @query limit - Number of results (default: 20)
         * @query offset - Skip results (default: 0)
         */
        ReferenceController_1.prototype.getAllUniversities = function (country, ranking, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getAllUniversities({
                            country: country,
                            ranking: ranking,
                            limit: limit ? parseInt(limit, 10) : 20,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get featured universities
         * GET /reference/universities/featured
         * @query limit - Number of universities (default: 10)
         */
        ReferenceController_1.prototype.getFeaturedUniversities = function (limit) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getFeaturedUniversities(limit ? parseInt(limit, 10) : 10)];
                });
            });
        };
        /**
         * Get university by ID
         * GET /reference/universities/:id
         */
        ReferenceController_1.prototype.getUniversityById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getUniversityById(id)];
                });
            });
        };
        /**
         * Get universities by country
         * GET /reference/universities/country/:country
         */
        ReferenceController_1.prototype.getUniversitiesByCountry = function (country) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getUniversitiesByCountry(country)];
                });
            });
        };
        // ==================== BANKS ====================
        /**
         * Get all banks
         * GET /reference/banks
         */
        ReferenceController_1.prototype.getAllBanks = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getAllBanks()];
                });
            });
        };
        /**
         * Get popular banks
         * GET /reference/banks/popular
         */
        ReferenceController_1.prototype.getPopularBanks = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getPopularBanks()];
                });
            });
        };
        /**
         * Get bank by ID
         * GET /reference/banks/:id
         */
        ReferenceController_1.prototype.getBankById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getBankById(id)];
                });
            });
        };
        /**
         * Get banks by type
         * GET /reference/banks/type/:type
         * @param type - Bank type (Public, Private, NBFC)
         */
        ReferenceController_1.prototype.getBanksByType = function (type) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getBanksByType(type)];
                });
            });
        };
        // ==================== COUNTRIES ====================
        /**
         * Get all countries
         * GET /reference/countries
         */
        ReferenceController_1.prototype.getAllCountries = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getAllCountries()];
                });
            });
        };
        /**
         * Get popular study destinations
         * GET /reference/countries/popular
         */
        ReferenceController_1.prototype.getPopularCountries = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getPopularCountries()];
                });
            });
        };
        /**
         * Get country by ID
         * GET /reference/countries/:id
         */
        ReferenceController_1.prototype.getCountryById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getCountryById(id)];
                });
            });
        };
        /**
         * Get country by code
         * GET /reference/countries/code/:code
         * @param code - Country code (e.g., US, UK, IN)
         */
        ReferenceController_1.prototype.getCountryByCode = function (code) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getCountryByCode(code)];
                });
            });
        };
        /**
         * Get countries by region
         * GET /reference/countries/region/:region
         * @param region - Region (e.g., Europe, Asia, North America)
         */
        ReferenceController_1.prototype.getCountriesByRegion = function (region) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getCountriesByRegion(region)];
                });
            });
        };
        // ==================== SCHOLARSHIPS ====================
        /**
         * Get all scholarships with filters
         * GET /reference/scholarships
         * @query country - Filter by country
         * @query type - Filter by type (Merit-based, Need-based, Sports)
         * @query limit - Number of results (default: 20)
         * @query offset - Skip results (default: 0)
         */
        ReferenceController_1.prototype.getAllScholarships = function (country, type, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getAllScholarships({
                            country: country,
                            type: type,
                            limit: limit ? parseInt(limit, 10) : 20,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get scholarship by ID
         * GET /reference/scholarships/:id
         */
        ReferenceController_1.prototype.getScholarshipById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getScholarshipById(id)];
                });
            });
        };
        /**
         * Get scholarships by country
         * GET /reference/scholarships/country/:country
         */
        ReferenceController_1.prototype.getScholarshipsByCountry = function (country) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getScholarshipsByCountry(country)];
                });
            });
        };
        // ==================== COURSES ====================
        /**
         * Get all courses with filters
         * GET /reference/courses
         * @query level - Filter by level (Undergraduate, Masters, PhD)
         * @query field - Filter by field (Engineering, Business, Medicine)
         * @query limit - Number of results (default: 20)
         * @query offset - Skip results (default: 0)
         */
        ReferenceController_1.prototype.getAllCourses = function (level, field, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getAllCourses({
                            level: level,
                            field: field,
                            limit: limit ? parseInt(limit, 10) : 20,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get popular courses
         * GET /reference/courses/popular
         */
        ReferenceController_1.prototype.getPopularCourses = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getPopularCourses()];
                });
            });
        };
        /**
         * Get course by ID
         * GET /reference/courses/:id
         */
        ReferenceController_1.prototype.getCourseById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getCourseById(id)];
                });
            });
        };
        /**
         * Get courses by level
         * GET /reference/courses/level/:level
         * @param level - Course level (Undergraduate, Masters, PhD)
         */
        ReferenceController_1.prototype.getCoursesByLevel = function (level) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getCoursesByLevel(level)];
                });
            });
        };
        /**
         * Get courses by field
         * GET /reference/courses/field/:field
         * @param field - Field of study (Engineering, Business, Medicine)
         */
        ReferenceController_1.prototype.getCoursesByField = function (field) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.referenceService.getCoursesByField(field)];
                });
            });
        };
        return ReferenceController_1;
    }());
    __setFunctionName(_classThis, "ReferenceController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getAllLoanTypes_decorators = [(0, common_1.Get)('loan-types')];
        _getPopularLoanTypes_decorators = [(0, common_1.Get)('loan-types/popular')];
        _getLoanTypeById_decorators = [(0, common_1.Get)('loan-types/:id')];
        _getAllUniversities_decorators = [(0, common_1.Get)('universities')];
        _getFeaturedUniversities_decorators = [(0, common_1.Get)('universities/featured')];
        _getUniversityById_decorators = [(0, common_1.Get)('universities/:id')];
        _getUniversitiesByCountry_decorators = [(0, common_1.Get)('universities/country/:country')];
        _getAllBanks_decorators = [(0, common_1.Get)('banks')];
        _getPopularBanks_decorators = [(0, common_1.Get)('banks/popular')];
        _getBankById_decorators = [(0, common_1.Get)('banks/:id')];
        _getBanksByType_decorators = [(0, common_1.Get)('banks/type/:type')];
        _getAllCountries_decorators = [(0, common_1.Get)('countries')];
        _getPopularCountries_decorators = [(0, common_1.Get)('countries/popular')];
        _getCountryById_decorators = [(0, common_1.Get)('countries/:id')];
        _getCountryByCode_decorators = [(0, common_1.Get)('countries/code/:code')];
        _getCountriesByRegion_decorators = [(0, common_1.Get)('countries/region/:region')];
        _getAllScholarships_decorators = [(0, common_1.Get)('scholarships')];
        _getScholarshipById_decorators = [(0, common_1.Get)('scholarships/:id')];
        _getScholarshipsByCountry_decorators = [(0, common_1.Get)('scholarships/country/:country')];
        _getAllCourses_decorators = [(0, common_1.Get)('courses')];
        _getPopularCourses_decorators = [(0, common_1.Get)('courses/popular')];
        _getCourseById_decorators = [(0, common_1.Get)('courses/:id')];
        _getCoursesByLevel_decorators = [(0, common_1.Get)('courses/level/:level')];
        _getCoursesByField_decorators = [(0, common_1.Get)('courses/field/:field')];
        __esDecorate(_classThis, null, _getAllLoanTypes_decorators, { kind: "method", name: "getAllLoanTypes", static: false, private: false, access: { has: function (obj) { return "getAllLoanTypes" in obj; }, get: function (obj) { return obj.getAllLoanTypes; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPopularLoanTypes_decorators, { kind: "method", name: "getPopularLoanTypes", static: false, private: false, access: { has: function (obj) { return "getPopularLoanTypes" in obj; }, get: function (obj) { return obj.getPopularLoanTypes; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLoanTypeById_decorators, { kind: "method", name: "getLoanTypeById", static: false, private: false, access: { has: function (obj) { return "getLoanTypeById" in obj; }, get: function (obj) { return obj.getLoanTypeById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllUniversities_decorators, { kind: "method", name: "getAllUniversities", static: false, private: false, access: { has: function (obj) { return "getAllUniversities" in obj; }, get: function (obj) { return obj.getAllUniversities; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFeaturedUniversities_decorators, { kind: "method", name: "getFeaturedUniversities", static: false, private: false, access: { has: function (obj) { return "getFeaturedUniversities" in obj; }, get: function (obj) { return obj.getFeaturedUniversities; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUniversityById_decorators, { kind: "method", name: "getUniversityById", static: false, private: false, access: { has: function (obj) { return "getUniversityById" in obj; }, get: function (obj) { return obj.getUniversityById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUniversitiesByCountry_decorators, { kind: "method", name: "getUniversitiesByCountry", static: false, private: false, access: { has: function (obj) { return "getUniversitiesByCountry" in obj; }, get: function (obj) { return obj.getUniversitiesByCountry; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllBanks_decorators, { kind: "method", name: "getAllBanks", static: false, private: false, access: { has: function (obj) { return "getAllBanks" in obj; }, get: function (obj) { return obj.getAllBanks; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPopularBanks_decorators, { kind: "method", name: "getPopularBanks", static: false, private: false, access: { has: function (obj) { return "getPopularBanks" in obj; }, get: function (obj) { return obj.getPopularBanks; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBankById_decorators, { kind: "method", name: "getBankById", static: false, private: false, access: { has: function (obj) { return "getBankById" in obj; }, get: function (obj) { return obj.getBankById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBanksByType_decorators, { kind: "method", name: "getBanksByType", static: false, private: false, access: { has: function (obj) { return "getBanksByType" in obj; }, get: function (obj) { return obj.getBanksByType; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllCountries_decorators, { kind: "method", name: "getAllCountries", static: false, private: false, access: { has: function (obj) { return "getAllCountries" in obj; }, get: function (obj) { return obj.getAllCountries; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPopularCountries_decorators, { kind: "method", name: "getPopularCountries", static: false, private: false, access: { has: function (obj) { return "getPopularCountries" in obj; }, get: function (obj) { return obj.getPopularCountries; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCountryById_decorators, { kind: "method", name: "getCountryById", static: false, private: false, access: { has: function (obj) { return "getCountryById" in obj; }, get: function (obj) { return obj.getCountryById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCountryByCode_decorators, { kind: "method", name: "getCountryByCode", static: false, private: false, access: { has: function (obj) { return "getCountryByCode" in obj; }, get: function (obj) { return obj.getCountryByCode; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCountriesByRegion_decorators, { kind: "method", name: "getCountriesByRegion", static: false, private: false, access: { has: function (obj) { return "getCountriesByRegion" in obj; }, get: function (obj) { return obj.getCountriesByRegion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllScholarships_decorators, { kind: "method", name: "getAllScholarships", static: false, private: false, access: { has: function (obj) { return "getAllScholarships" in obj; }, get: function (obj) { return obj.getAllScholarships; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getScholarshipById_decorators, { kind: "method", name: "getScholarshipById", static: false, private: false, access: { has: function (obj) { return "getScholarshipById" in obj; }, get: function (obj) { return obj.getScholarshipById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getScholarshipsByCountry_decorators, { kind: "method", name: "getScholarshipsByCountry", static: false, private: false, access: { has: function (obj) { return "getScholarshipsByCountry" in obj; }, get: function (obj) { return obj.getScholarshipsByCountry; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllCourses_decorators, { kind: "method", name: "getAllCourses", static: false, private: false, access: { has: function (obj) { return "getAllCourses" in obj; }, get: function (obj) { return obj.getAllCourses; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPopularCourses_decorators, { kind: "method", name: "getPopularCourses", static: false, private: false, access: { has: function (obj) { return "getPopularCourses" in obj; }, get: function (obj) { return obj.getPopularCourses; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseById_decorators, { kind: "method", name: "getCourseById", static: false, private: false, access: { has: function (obj) { return "getCourseById" in obj; }, get: function (obj) { return obj.getCourseById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCoursesByLevel_decorators, { kind: "method", name: "getCoursesByLevel", static: false, private: false, access: { has: function (obj) { return "getCoursesByLevel" in obj; }, get: function (obj) { return obj.getCoursesByLevel; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCoursesByField_decorators, { kind: "method", name: "getCoursesByField", static: false, private: false, access: { has: function (obj) { return "getCoursesByField" in obj; }, get: function (obj) { return obj.getCoursesByField; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReferenceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReferenceController = _classThis;
}();
exports.ReferenceController = ReferenceController;

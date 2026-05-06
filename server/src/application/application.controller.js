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
exports.ApplicationController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var multer_1 = require("multer");
var path_1 = require("path");
var fs_1 = require("fs");
var user_guard_1 = require("../auth/user.guard");
var admin_guard_1 = require("../auth/admin.guard");
// Multer configuration for application documents
var storage = (0, multer_1.diskStorage)({
    destination: function (req, file, cb) {
        var uploadPath = './uploads/applications';
        if (!(0, fs_1.existsSync)(uploadPath)) {
            (0, fs_1.mkdirSync)(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        var uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        var ext = (0, path_1.extname)(file.originalname);
        cb(null, "app-doc-".concat(uniqueSuffix).concat(ext));
    },
});
var ApplicationController = function () {
    var _classDecorators = [(0, common_1.Controller)('applications')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _trackApplication_decorators;
    var _getRequiredDocuments_decorators;
    var _getApplicationStages_decorators;
    var _createApplication_decorators;
    var _getMyApplications_decorators;
    var _getApplicationById_decorators;
    var _getApplicationTracking_decorators;
    var _updateApplication_decorators;
    var _submitApplication_decorators;
    var _cancelApplication_decorators;
    var _deleteApplication_decorators;
    var _getApplicationDocuments_decorators;
    var _uploadDocument_decorators;
    var _deleteDocument_decorators;
    var _getAllApplications_decorators;
    var _getApplicationStats_decorators;
    var _updateApplicationStatus_decorators;
    var _getDocumentsAdmin_decorators;
    var _verifyDocument_decorators;
    var _getTrackingAdmin_decorators;
    var _getApplicationNotes_decorators;
    var _addApplicationNote_decorators;
    var ApplicationController = _classThis = /** @class */ (function () {
        function ApplicationController_1(applicationService) {
            this.applicationService = (__runInitializers(this, _instanceExtraInitializers), applicationService);
        }
        // ==================== PUBLIC ENDPOINTS ====================
        /**
         * Track application by application number (public)
         * GET /applications/track/:applicationNumber
         */
        ApplicationController_1.prototype.trackApplication = function (applicationNumber) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.trackApplication(applicationNumber)];
                });
            });
        };
        /**
         * Get required documents list for a loan type
         * GET /applications/required-documents/:loanType
         */
        ApplicationController_1.prototype.getRequiredDocuments = function (loanType) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getRequiredDocuments(loanType)];
                });
            });
        };
        /**
         * Get application stages
         * GET /applications/stages
         */
        ApplicationController_1.prototype.getApplicationStages = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getApplicationStages()];
                });
            });
        };
        // ==================== USER ENDPOINTS ====================
        /**
         * Create a new loan application
         * POST /applications
         * @body Complete application data
         */
        ApplicationController_1.prototype.createApplication = function (req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            console.log('[ApplicationController] Creating application for user:', req.user.id);
                            console.log('[ApplicationController] Body:', JSON.stringify(body, null, 2));
                            return [4 /*yield*/, this.applicationService.createApplication(req.user.id, body)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_1 = _a.sent();
                            console.error('[ApplicationController] Error creating application:', error_1);
                            throw error_1;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get all user's applications
         * GET /applications/my
         * @query status - Filter by status
         * @query loanType - Filter by loan type
         * @query limit - Number of results (default: 20)
         * @query offset - Skip results (default: 0)
         */
        ApplicationController_1.prototype.getMyApplications = function (req, status, loanType, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getUserApplications(req.user.id, {
                            status: status,
                            loanType: loanType,
                            limit: limit ? parseInt(limit, 10) : 20,
                            offset: offset ? parseInt(offset, 10) : 0,
                        })];
                });
            });
        };
        /**
         * Get application by ID
         * GET /applications/:id
         */
        ApplicationController_1.prototype.getApplicationById = function (req, id) {
            return __awaiter(this, void 0, void 0, function () {
                var application;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.applicationService.getApplicationById(id)];
                        case 1:
                            application = _a.sent();
                            // Verify ownership (unless admin)
                            if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && application.userId !== req.user.id) {
                                throw new common_1.BadRequestException('Unauthorized to view this application');
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    data: application
                                }];
                    }
                });
            });
        };
        /**
         * Get application tracking/timeline
         * GET /applications/:id/tracking
         */
        ApplicationController_1.prototype.getApplicationTracking = function (req, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getApplicationTracking(id, req.user.id)];
                });
            });
        };
        /**
         * Update application
         * PUT /applications/:id
         */
        ApplicationController_1.prototype.updateApplication = function (req, id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.updateApplication(id, req.user.id, body)];
                });
            });
        };
        /**
         * Submit a draft application
         * POST /applications/:id/submit
         */
        ApplicationController_1.prototype.submitApplication = function (req, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.submitApplication(id, req.user.id)];
                });
            });
        };
        /**
         * Cancel application
         * POST /applications/:id/cancel
         * @body reason - Cancellation reason (optional)
         */
        ApplicationController_1.prototype.cancelApplication = function (req, id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.cancelApplication(id, req.user.id, body === null || body === void 0 ? void 0 : body.reason)];
                });
            });
        };
        /**
         * Delete application
         * DELETE /applications/:id
         */
        ApplicationController_1.prototype.deleteApplication = function (req, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.deleteApplication(id, req.user.id)];
                });
            });
        };
        /**
         * Get documents for an application
         * GET /applications/:id/documents
         */
        ApplicationController_1.prototype.getApplicationDocuments = function (req, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getApplicationDocuments(id, req.user.id)];
                });
            });
        };
        /**
         * Upload document to application
         * POST /applications/:id/documents
         */
        ApplicationController_1.prototype.uploadDocument = function (req, applicationId, file, docType, docName) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!file) {
                        throw new common_1.BadRequestException('File is required');
                    }
                    if (!docType) {
                        if (file === null || file === void 0 ? void 0 : file.path) {
                            try {
                                (0, fs_1.unlinkSync)(file.path);
                            }
                            catch (e) { }
                        }
                        throw new common_1.BadRequestException('docType is required');
                    }
                    return [2 /*return*/, this.applicationService.uploadDocument(applicationId, req.user.id, {
                            docType: docType,
                            docName: docName || file.originalname,
                            fileName: file.filename,
                            filePath: file.path,
                            fileSize: file.size,
                            mimeType: file.mimetype,
                        })];
                });
            });
        };
        /**
         * Delete document from application
         * DELETE /applications/:id/documents/:documentId
         */
        ApplicationController_1.prototype.deleteDocument = function (req, applicationId, documentId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.deleteDocument(documentId, req.user.id)];
                });
            });
        };
        // ==================== ADMIN ENDPOINTS ====================
        /**
         * Get all applications (Admin)
         * GET /applications/admin/all
         * @query status - Filter by status
         * @query stage - Filter by stage
         * @query loanType - Filter by loan type
         * @query bank - Filter by bank
         * @query search - Search term
         * @query fromDate - From date
         * @query toDate - To date
         * @query limit - Number of results
         * @query offset - Skip results
         * @query sortBy - Sort field
         * @query sortOrder - Sort order (asc/desc)
         */
        ApplicationController_1.prototype.getAllApplications = function (status, stage, loanType, bank, search, fromDate, toDate, limit, offset, sortBy, sortOrder) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getAllApplications({
                            status: status,
                            stage: stage,
                            loanType: loanType,
                            bank: bank,
                            search: search,
                            fromDate: fromDate,
                            toDate: toDate,
                            limit: limit ? parseInt(limit, 10) : 20,
                            offset: offset ? parseInt(offset, 10) : 0,
                            sortBy: sortBy,
                            sortOrder: sortOrder,
                        })];
                });
            });
        };
        /**
         * Get application statistics (Admin)
         * GET /applications/admin/stats
         */
        ApplicationController_1.prototype.getApplicationStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getApplicationStats()];
                });
            });
        };
        /**
         * Update application status (Admin)
         * PUT /applications/admin/:id/status
         */
        ApplicationController_1.prototype.updateApplicationStatus = function (req, id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var adminName;
                return __generator(this, function (_a) {
                    adminName = "".concat(req.user.firstName || '', " ").concat(req.user.lastName || '').trim() || req.user.email;
                    return [2 /*return*/, this.applicationService.updateApplicationStatus(id, req.user.id, adminName, body)];
                });
            });
        };
        /**
         * Get application documents (Admin)
         * GET /applications/admin/:id/documents
         */
        ApplicationController_1.prototype.getDocumentsAdmin = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getApplicationDocuments(id)];
                });
            });
        };
        /**
         * Verify/Reject document (Admin)
         * PUT /applications/admin/documents/:documentId/verify
         */
        ApplicationController_1.prototype.verifyDocument = function (req, documentId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.verifyDocument(documentId, req.user.id, body)];
                });
            });
        };
        /**
         * Get application tracking (Admin)
         * GET /applications/admin/:id/tracking
         */
        ApplicationController_1.prototype.getTrackingAdmin = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getApplicationTracking(id)];
                });
            });
        };
        /**
         * Get application notes (Admin)
         * GET /applications/admin/:id/notes
         */
        ApplicationController_1.prototype.getApplicationNotes = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.applicationService.getApplicationNotes(id, true)];
                });
            });
        };
        /**
         * Add note to application (Admin)
         * POST /applications/admin/:id/notes
         */
        ApplicationController_1.prototype.addApplicationNote = function (req, id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var authorName;
                return __generator(this, function (_a) {
                    authorName = "".concat(req.user.firstName || '', " ").concat(req.user.lastName || '').trim() || req.user.email;
                    return [2 /*return*/, this.applicationService.addApplicationNote(id, req.user.id, authorName, body)];
                });
            });
        };
        return ApplicationController_1;
    }());
    __setFunctionName(_classThis, "ApplicationController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _trackApplication_decorators = [(0, common_1.Get)('track/:applicationNumber')];
        _getRequiredDocuments_decorators = [(0, common_1.Get)('required-documents/:loanType')];
        _getApplicationStages_decorators = [(0, common_1.Get)('stages')];
        _createApplication_decorators = [(0, common_1.Post)(), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _getMyApplications_decorators = [(0, common_1.Get)('my'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _getApplicationById_decorators = [(0, common_1.Get)(':id'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _getApplicationTracking_decorators = [(0, common_1.Get)(':id/tracking'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _updateApplication_decorators = [(0, common_1.Put)(':id'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _submitApplication_decorators = [(0, common_1.Post)(':id/submit'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _cancelApplication_decorators = [(0, common_1.Post)(':id/cancel'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _deleteApplication_decorators = [(0, common_1.Delete)(':id'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _getApplicationDocuments_decorators = [(0, common_1.Get)(':id/documents'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _uploadDocument_decorators = [(0, common_1.Post)(':id/documents'), (0, common_1.UseGuards)(user_guard_1.UserGuard), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                storage: storage,
                limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
                fileFilter: function (req, file, cb) {
                    if (file.mimetype.match(/\/(jpg|jpeg|png|pdf|doc|docx)$/)) {
                        cb(null, true);
                    }
                    else {
                        cb(new common_1.BadRequestException('Unsupported file type. Allowed: jpg, jpeg, png, pdf, doc, docx'), false);
                    }
                }
            }))];
        _deleteDocument_decorators = [(0, common_1.Delete)(':id/documents/:documentId'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
        _getAllApplications_decorators = [(0, common_1.Get)('admin/all'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getApplicationStats_decorators = [(0, common_1.Get)('admin/stats'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _updateApplicationStatus_decorators = [(0, common_1.Put)('admin/:id/status'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getDocumentsAdmin_decorators = [(0, common_1.Get)('admin/:id/documents'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _verifyDocument_decorators = [(0, common_1.Put)('admin/documents/:documentId/verify'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getTrackingAdmin_decorators = [(0, common_1.Get)('admin/:id/tracking'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _getApplicationNotes_decorators = [(0, common_1.Get)('admin/:id/notes'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _addApplicationNote_decorators = [(0, common_1.Post)('admin/:id/notes'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        __esDecorate(_classThis, null, _trackApplication_decorators, { kind: "method", name: "trackApplication", static: false, private: false, access: { has: function (obj) { return "trackApplication" in obj; }, get: function (obj) { return obj.trackApplication; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRequiredDocuments_decorators, { kind: "method", name: "getRequiredDocuments", static: false, private: false, access: { has: function (obj) { return "getRequiredDocuments" in obj; }, get: function (obj) { return obj.getRequiredDocuments; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApplicationStages_decorators, { kind: "method", name: "getApplicationStages", static: false, private: false, access: { has: function (obj) { return "getApplicationStages" in obj; }, get: function (obj) { return obj.getApplicationStages; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createApplication_decorators, { kind: "method", name: "createApplication", static: false, private: false, access: { has: function (obj) { return "createApplication" in obj; }, get: function (obj) { return obj.createApplication; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyApplications_decorators, { kind: "method", name: "getMyApplications", static: false, private: false, access: { has: function (obj) { return "getMyApplications" in obj; }, get: function (obj) { return obj.getMyApplications; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApplicationById_decorators, { kind: "method", name: "getApplicationById", static: false, private: false, access: { has: function (obj) { return "getApplicationById" in obj; }, get: function (obj) { return obj.getApplicationById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApplicationTracking_decorators, { kind: "method", name: "getApplicationTracking", static: false, private: false, access: { has: function (obj) { return "getApplicationTracking" in obj; }, get: function (obj) { return obj.getApplicationTracking; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateApplication_decorators, { kind: "method", name: "updateApplication", static: false, private: false, access: { has: function (obj) { return "updateApplication" in obj; }, get: function (obj) { return obj.updateApplication; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitApplication_decorators, { kind: "method", name: "submitApplication", static: false, private: false, access: { has: function (obj) { return "submitApplication" in obj; }, get: function (obj) { return obj.submitApplication; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancelApplication_decorators, { kind: "method", name: "cancelApplication", static: false, private: false, access: { has: function (obj) { return "cancelApplication" in obj; }, get: function (obj) { return obj.cancelApplication; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteApplication_decorators, { kind: "method", name: "deleteApplication", static: false, private: false, access: { has: function (obj) { return "deleteApplication" in obj; }, get: function (obj) { return obj.deleteApplication; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApplicationDocuments_decorators, { kind: "method", name: "getApplicationDocuments", static: false, private: false, access: { has: function (obj) { return "getApplicationDocuments" in obj; }, get: function (obj) { return obj.getApplicationDocuments; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _uploadDocument_decorators, { kind: "method", name: "uploadDocument", static: false, private: false, access: { has: function (obj) { return "uploadDocument" in obj; }, get: function (obj) { return obj.uploadDocument; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteDocument_decorators, { kind: "method", name: "deleteDocument", static: false, private: false, access: { has: function (obj) { return "deleteDocument" in obj; }, get: function (obj) { return obj.deleteDocument; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllApplications_decorators, { kind: "method", name: "getAllApplications", static: false, private: false, access: { has: function (obj) { return "getAllApplications" in obj; }, get: function (obj) { return obj.getAllApplications; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApplicationStats_decorators, { kind: "method", name: "getApplicationStats", static: false, private: false, access: { has: function (obj) { return "getApplicationStats" in obj; }, get: function (obj) { return obj.getApplicationStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateApplicationStatus_decorators, { kind: "method", name: "updateApplicationStatus", static: false, private: false, access: { has: function (obj) { return "updateApplicationStatus" in obj; }, get: function (obj) { return obj.updateApplicationStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDocumentsAdmin_decorators, { kind: "method", name: "getDocumentsAdmin", static: false, private: false, access: { has: function (obj) { return "getDocumentsAdmin" in obj; }, get: function (obj) { return obj.getDocumentsAdmin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyDocument_decorators, { kind: "method", name: "verifyDocument", static: false, private: false, access: { has: function (obj) { return "verifyDocument" in obj; }, get: function (obj) { return obj.verifyDocument; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTrackingAdmin_decorators, { kind: "method", name: "getTrackingAdmin", static: false, private: false, access: { has: function (obj) { return "getTrackingAdmin" in obj; }, get: function (obj) { return obj.getTrackingAdmin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApplicationNotes_decorators, { kind: "method", name: "getApplicationNotes", static: false, private: false, access: { has: function (obj) { return "getApplicationNotes" in obj; }, get: function (obj) { return obj.getApplicationNotes; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addApplicationNote_decorators, { kind: "method", name: "addApplicationNote", static: false, private: false, access: { has: function (obj) { return "addApplicationNote" in obj; }, get: function (obj) { return obj.addApplicationNote; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ApplicationController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ApplicationController = _classThis;
}();
exports.ApplicationController = ApplicationController;

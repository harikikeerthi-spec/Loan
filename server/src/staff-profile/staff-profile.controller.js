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
exports.StaffProfileController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var multer_1 = require("multer");
var path_1 = require("path");
var fs_1 = require("fs");
var staff_guard_1 = require("../auth/staff.guard");
var uploadStorage = (0, multer_1.diskStorage)({
    destination: function (_req, _file, cb) {
        var dir = './uploads/staff-documents';
        if (!(0, fs_1.existsSync)(dir))
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (_req, file, cb) {
        var unique = "".concat(Date.now(), "-").concat(Math.round(Math.random() * 1e9));
        cb(null, "staff-".concat(unique).concat((0, path_1.extname)(file.originalname)));
    },
});
var StaffProfileController = function () {
    var _classDecorators = [(0, common_1.UseGuards)(staff_guard_1.StaffGuard), (0, common_1.Controller)('staff-profiles')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _list_decorators;
    var _create_decorators;
    var _getOne_decorators;
    var _fetchDocs_decorators;
    var _getDocs_decorators;
    var _uploadDoc_decorators;
    var _updateStatus_decorators;
    var _removeDoc_decorators;
    var _share_decorators;
    var _getShares_decorators;
    var StaffProfileController = _classThis = /** @class */ (function () {
        function StaffProfileController_1(svc) {
            this.svc = (__runInitializers(this, _instanceExtraInitializers), svc);
        }
        // ─── List all profiles ─────────────────────────────────────────────────────
        StaffProfileController_1.prototype.list = function (req, search, bankStatus) {
            return __awaiter(this, void 0, void 0, function () {
                var profiles;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.svc.listProfiles(req.user, { search: search, bankStatus: bankStatus })];
                        case 1:
                            profiles = _a.sent();
                            return [2 /*return*/, { success: true, data: profiles, total: profiles.length }];
                    }
                });
            });
        };
        // ─── Create a new staff profile linked to a website user ──────────────────
        StaffProfileController_1.prototype.create = function (req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var profile;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body.linked_user_id)
                                throw new common_1.BadRequestException('linked_user_id is required');
                            return [4 /*yield*/, this.svc.createProfile(req.user, body)];
                        case 1:
                            profile = _a.sent();
                            return [2 /*return*/, { success: true, data: profile }];
                    }
                });
            });
        };
        // ─── Get a single profile (with documents) ────────────────────────────────
        StaffProfileController_1.prototype.getOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var profile;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.svc.getProfile(id)];
                        case 1:
                            profile = _a.sent();
                            return [2 /*return*/, { success: true, data: profile }];
                    }
                });
            });
        };
        // ─── Fetch & attach documents from the linked user's account ──────────────
        StaffProfileController_1.prototype.fetchDocs = function (id, req) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.svc.fetchUserDocuments(id, req.user)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, __assign({ success: true }, result)];
                    }
                });
            });
        };
        // ─── Get documents attached to a profile ──────────────────────────────────
        StaffProfileController_1.prototype.getDocs = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var docs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.svc.getProfileDocuments(id)];
                        case 1:
                            docs = _a.sent();
                            return [2 /*return*/, { success: true, data: docs }];
                    }
                });
            });
        };
        // ─── Staff manually uploads a document and attaches it ────────────────────
        StaffProfileController_1.prototype.uploadDoc = function (id, req, file, docType, description) {
            return __awaiter(this, void 0, void 0, function () {
                var doc;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!docType)
                                throw new common_1.BadRequestException('doc_type is required');
                            return [4 /*yield*/, this.svc.uploadStaffDocument(id, req.user, file, {
                                    doc_type: docType,
                                    description: description,
                                })];
                        case 1:
                            doc = _a.sent();
                            return [2 /*return*/, { success: true, data: doc }];
                    }
                });
            });
        };
        // ─── Update document status + back-sync to user profile ───────────────────
        StaffProfileController_1.prototype.updateStatus = function (id, docId, req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.svc.updateDocumentStatus(id, docId, req.user, body)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, { success: true, data: result }];
                    }
                });
            });
        };
        // ─── Remove (detach) a document from a profile ────────────────────────────
        StaffProfileController_1.prototype.removeDoc = function (id, docId, req) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.svc.removeDocument(id, docId, req.user)];
                });
            });
        };
        // ─── Share document bundle with bank ──────────────────────────────────────
        StaffProfileController_1.prototype.share = function (id, req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.svc.shareWithBank(id, req.user, body)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, { success: true, data: result }];
                    }
                });
            });
        };
        // ─── Get share history for a profile ──────────────────────────────────────
        StaffProfileController_1.prototype.getShares = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var shares;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.svc.getShareHistory(id)];
                        case 1:
                            shares = _a.sent();
                            return [2 /*return*/, { success: true, data: shares }];
                    }
                });
            });
        };
        return StaffProfileController_1;
    }());
    __setFunctionName(_classThis, "StaffProfileController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _list_decorators = [(0, common_1.Get)()];
        _create_decorators = [(0, common_1.Post)()];
        _getOne_decorators = [(0, common_1.Get)(':id')];
        _fetchDocs_decorators = [(0, common_1.Post)(':id/fetch-documents')];
        _getDocs_decorators = [(0, common_1.Get)(':id/documents')];
        _uploadDoc_decorators = [(0, common_1.Post)(':id/documents'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                storage: uploadStorage,
                limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
                fileFilter: function (_req, file, cb) {
                    if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/))
                        cb(null, true);
                    else
                        cb(new common_1.BadRequestException('Only PDF, JPG, PNG allowed'), false);
                },
            }))];
        _updateStatus_decorators = [(0, common_1.Patch)(':id/documents/:docId/status')];
        _removeDoc_decorators = [(0, common_1.Delete)(':id/documents/:docId')];
        _share_decorators = [(0, common_1.Post)(':id/share')];
        _getShares_decorators = [(0, common_1.Get)(':id/shares')];
        __esDecorate(_classThis, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: function (obj) { return "list" in obj; }, get: function (obj) { return obj.list; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOne_decorators, { kind: "method", name: "getOne", static: false, private: false, access: { has: function (obj) { return "getOne" in obj; }, get: function (obj) { return obj.getOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _fetchDocs_decorators, { kind: "method", name: "fetchDocs", static: false, private: false, access: { has: function (obj) { return "fetchDocs" in obj; }, get: function (obj) { return obj.fetchDocs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDocs_decorators, { kind: "method", name: "getDocs", static: false, private: false, access: { has: function (obj) { return "getDocs" in obj; }, get: function (obj) { return obj.getDocs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _uploadDoc_decorators, { kind: "method", name: "uploadDoc", static: false, private: false, access: { has: function (obj) { return "uploadDoc" in obj; }, get: function (obj) { return obj.uploadDoc; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateStatus_decorators, { kind: "method", name: "updateStatus", static: false, private: false, access: { has: function (obj) { return "updateStatus" in obj; }, get: function (obj) { return obj.updateStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removeDoc_decorators, { kind: "method", name: "removeDoc", static: false, private: false, access: { has: function (obj) { return "removeDoc" in obj; }, get: function (obj) { return obj.removeDoc; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _share_decorators, { kind: "method", name: "share", static: false, private: false, access: { has: function (obj) { return "share" in obj; }, get: function (obj) { return obj.share; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getShares_decorators, { kind: "method", name: "getShares", static: false, private: false, access: { has: function (obj) { return "getShares" in obj; }, get: function (obj) { return obj.getShares; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StaffProfileController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StaffProfileController = _classThis;
}();
exports.StaffProfileController = StaffProfileController;

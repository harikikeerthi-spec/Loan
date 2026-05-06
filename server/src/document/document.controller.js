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
exports.DocumentController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var multer_1 = require("multer");
var path_1 = require("path");
var fs_1 = require("fs");
// Multer configuration
var storage = (0, multer_1.diskStorage)({
    destination: function (req, file, cb) {
        var uploadPath = './uploads/documents';
        if (!(0, fs_1.existsSync)(uploadPath)) {
            (0, fs_1.mkdirSync)(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        var uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        var ext = (0, path_1.extname)(file.originalname);
        cb(null, "".concat(file.fieldname, "-").concat(uniqueSuffix).concat(ext));
    },
});
var DocumentController = function () {
    var _classDecorators = [(0, common_1.Controller)('documents')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _uploadFile_decorators;
    var _getUserDocuments_decorators;
    var _deleteDocument_decorators;
    var DocumentController = _classThis = /** @class */ (function () {
        function DocumentController_1(usersService) {
            this.usersService = (__runInitializers(this, _instanceExtraInitializers), usersService);
        }
        DocumentController_1.prototype.uploadFile = function (file, userId, docType) {
            return __awaiter(this, void 0, void 0, function () {
                var document;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!file) {
                                throw new common_1.BadRequestException('File is required');
                            }
                            if (!userId || !docType) {
                                // If validation fails, we might want to delete the file
                                (0, fs_1.unlinkSync)(file.path);
                                throw new common_1.BadRequestException('userId and docType are required');
                            }
                            return [4 /*yield*/, this.usersService.upsertUserDocument(userId, docType, {
                                    uploaded: true,
                                    filePath: file.path,
                                    status: 'uploaded'
                                })];
                        case 1:
                            document = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: document,
                                    file: {
                                        originalName: file.originalname,
                                        filename: file.filename,
                                        // In a real app, this should be a public URL. 
                                        // For now, we return the path so the frontend knows it's saved.
                                        path: file.path
                                    }
                                }];
                    }
                });
            });
        };
        DocumentController_1.prototype.getUserDocuments = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var documents;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersService.getUserDocuments(userId)];
                        case 1:
                            documents = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: documents
                                }];
                    }
                });
            });
        };
        DocumentController_1.prototype.deleteDocument = function (userId, docType) {
            return __awaiter(this, void 0, void 0, function () {
                var docs, doc;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersService.getUserDocuments(userId)];
                        case 1:
                            docs = _a.sent();
                            doc = docs.find(function (d) { return d.docType === docType; });
                            if (doc && doc.filePath && (0, fs_1.existsSync)(doc.filePath)) {
                                try {
                                    (0, fs_1.unlinkSync)(doc.filePath);
                                }
                                catch (e) {
                                    console.error('Error deleting file:', e);
                                }
                            }
                            return [4 /*yield*/, this.usersService.deleteUserDocument(userId, docType)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Document deleted successfully'
                                }];
                    }
                });
            });
        };
        return DocumentController_1;
    }());
    __setFunctionName(_classThis, "DocumentController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _uploadFile_decorators = [(0, common_1.Post)('upload'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                storage: storage,
                limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
                fileFilter: function (req, file, cb) {
                    if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
                        cb(null, true);
                    }
                    else {
                        cb(new common_1.BadRequestException('Unsupported file type'), false);
                    }
                }
            }))];
        _getUserDocuments_decorators = [(0, common_1.Get)(':userId')];
        _deleteDocument_decorators = [(0, common_1.Delete)(':userId/:docType')];
        __esDecorate(_classThis, null, _uploadFile_decorators, { kind: "method", name: "uploadFile", static: false, private: false, access: { has: function (obj) { return "uploadFile" in obj; }, get: function (obj) { return obj.uploadFile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserDocuments_decorators, { kind: "method", name: "getUserDocuments", static: false, private: false, access: { has: function (obj) { return "getUserDocuments" in obj; }, get: function (obj) { return obj.getUserDocuments; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteDocument_decorators, { kind: "method", name: "deleteDocument", static: false, private: false, access: { has: function (obj) { return "deleteDocument" in obj; }, get: function (obj) { return obj.deleteDocument; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DocumentController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DocumentController = _classThis;
}();
exports.DocumentController = DocumentController;

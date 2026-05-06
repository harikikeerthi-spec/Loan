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
exports.UsersService = void 0;
var common_1 = require("@nestjs/common");
var UsersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UsersService = _classThis = /** @class */ (function () {
        function UsersService_1(prisma) {
            this.prisma = prisma;
        }
        UsersService_1.prototype.findOne = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.user.findUnique({
                            where: { email: email },
                        })];
                });
            });
        };
        UsersService_1.prototype.findById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.user.findUnique({
                            where: { id: id },
                        })];
                });
            });
        };
        UsersService_1.prototype.create = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var dobDate, dobParts, day, month, year;
                return __generator(this, function (_a) {
                    dobDate = null;
                    if (data.dateOfBirth) {
                        dobParts = data.dateOfBirth.split('-');
                        if (dobParts.length === 3) {
                            day = parseInt(dobParts[0], 10);
                            month = parseInt(dobParts[1], 10) - 1;
                            year = parseInt(dobParts[2], 10);
                            dobDate = new Date(year, month, day);
                        }
                    }
                    return [2 /*return*/, this.prisma.user.create({
                            data: {
                                email: data.email,
                                firstName: data.firstName || null,
                                lastName: data.lastName || null,
                                phoneNumber: data.phoneNumber || null,
                                dateOfBirth: dobDate,
                                mobile: data.mobile || '',
                                password: data.password || '',
                            },
                        })];
                });
            });
        };
        UsersService_1.prototype.findAll = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.user.findMany()];
                });
            });
        };
        UsersService_1.prototype.updateUserDetails = function (email, firstName, lastName, phoneNumber, dateOfBirth) {
            return __awaiter(this, void 0, void 0, function () {
                var dobDate, dobParts, day, month, year;
                return __generator(this, function (_a) {
                    dobDate = null;
                    if (dateOfBirth) {
                        dobParts = dateOfBirth.split('-');
                        if (dobParts.length === 3) {
                            day = parseInt(dobParts[0], 10);
                            month = parseInt(dobParts[1], 10) - 1;
                            year = parseInt(dobParts[2], 10);
                            dobDate = new Date(year, month, day);
                        }
                    }
                    return [2 /*return*/, this.prisma.user.update({
                            where: { email: email },
                            data: {
                                firstName: firstName,
                                lastName: lastName,
                                phoneNumber: phoneNumber,
                                dateOfBirth: dobDate,
                            },
                        })];
                });
            });
        };
        UsersService_1.prototype.updateRefreshToken = function (email, refreshToken) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.user.update({
                            where: { email: email },
                            data: {
                                refreshToken: refreshToken,
                            },
                        })];
                });
            });
        };
        // Loan Application Methods
        UsersService_1.prototype.createLoanApplication = function (userId, data) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.loanApplication.create({
                            data: {
                                userId: userId,
                                bank: data.bank,
                                loanType: data.loanType,
                                amount: data.amount,
                                purpose: data.purpose || null,
                            },
                        })];
                });
            });
        };
        UsersService_1.prototype.getUserApplications = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.loanApplication.findMany({
                            where: { userId: userId },
                            orderBy: { date: 'desc' },
                        })];
                });
            });
        };
        UsersService_1.prototype.updateLoanApplicationStatus = function (applicationId, status) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.loanApplication.update({
                            where: { id: applicationId },
                            data: { status: status },
                        })];
                });
            });
        };
        UsersService_1.prototype.deleteLoanApplication = function (applicationId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.loanApplication.delete({
                            where: { id: applicationId },
                        })];
                });
            });
        };
        // Document Methods
        UsersService_1.prototype.upsertUserDocument = function (userId, docType, data) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.userDocument.upsert({
                            where: {
                                userId_docType: {
                                    userId: userId,
                                    docType: docType,
                                },
                            },
                            update: {
                                uploaded: data.uploaded,
                                status: data.status || 'pending',
                                filePath: data.filePath || null,
                                uploadedAt: data.uploaded ? new Date() : null,
                            },
                            create: {
                                userId: userId,
                                docType: docType,
                                uploaded: data.uploaded,
                                status: data.status || 'pending',
                                filePath: data.filePath || null,
                                uploadedAt: data.uploaded ? new Date() : null,
                            },
                        })];
                });
            });
        };
        UsersService_1.prototype.getUserDocuments = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.userDocument.findMany({
                            where: { userId: userId },
                            orderBy: { docType: 'asc' },
                        })];
                });
            });
        };
        UsersService_1.prototype.deleteUserDocument = function (userId, docType) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.userDocument.delete({
                            where: {
                                userId_docType: {
                                    userId: userId,
                                    docType: docType,
                                },
                            },
                        })];
                });
            });
        };
        // Get user dashboard data with all applications and documents
        UsersService_1.prototype.getUserDashboardData = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var applications, documents;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getUserApplications(userId)];
                        case 1:
                            applications = _a.sent();
                            return [4 /*yield*/, this.getUserDocuments(userId)];
                        case 2:
                            documents = _a.sent();
                            return [2 /*return*/, {
                                    applications: applications,
                                    documents: documents,
                                }];
                    }
                });
            });
        };
        return UsersService_1;
    }());
    __setFunctionName(_classThis, "UsersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersService = _classThis;
}();
exports.UsersService = UsersService;

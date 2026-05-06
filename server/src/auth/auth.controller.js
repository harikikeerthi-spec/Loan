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
exports.AuthController = void 0;
var common_1 = require("@nestjs/common");
var AuthController = function () {
    var _classDecorators = [(0, common_1.Controller)('auth')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _checkUserExists_decorators;
    var _sendOtp_decorators;
    var _verifyOtp_decorators;
    var _refreshToken_decorators;
    var _logout_decorators;
    var _getUserDashboard_decorators;
    var _getDashboardData_decorators;
    var _updateUserDetails_decorators;
    var _createApplication_decorators;
    var _getApplications_decorators;
    var _updateApplication_decorators;
    var _deleteApplication_decorators;
    var _uploadDocument_decorators;
    var _getDocuments_decorators;
    var _deleteDocument_decorators;
    var AuthController = _classThis = /** @class */ (function () {
        function AuthController_1(authService, usersService, referralService) {
            this.authService = (__runInitializers(this, _instanceExtraInitializers), authService);
            this.usersService = usersService;
            this.referralService = referralService;
        }
        /**
         * Check if a user exists in the system
         * GET /auth/check-user/:email
         * @param email - User's email address
         * @returns { exists: boolean, message: string }
         */
        AuthController_1.prototype.checkUserExists = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.authService.checkUserExists(email)];
                });
            });
        };
        // ==================== UNIFIED OTP FLOW ====================
        /**
         * Step 1: Send OTP to email (Works for both new and existing users)
         * POST /auth/send-otp
         * @body email: string (required)
         * @returns { success: boolean, message: string, userExists: boolean }
         */
        AuthController_1.prototype.sendOtp = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!body || !body.email) {
                        return [2 /*return*/, {
                                success: false,
                                message: 'Email address is required',
                            }];
                    }
                    return [2 /*return*/, this.authService.sendOtpUnified(body.email)];
                });
            });
        };
        /**
         * Step 2: Verify OTP and determine user flow
         * POST /auth/verify-otp
         * @body email: string (required), otp: string (required, 6 digits)
         * @returns {
         *   success: boolean,
         *   access_token: string,
         *   userExists: boolean,
         *   hasUserDetails: boolean,
         *   message: string
         * }
         *
         * Flow:
         * - If userExists: true && hasUserDetails: true → Navigate to homepage
         * - If userExists: true && hasUserDetails: false → Navigate to user-details.html
         * - If userExists: false → Navigate to user-details.html (new user)
         */
        AuthController_1.prototype.verifyOtp = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.email || !body.otp) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email and OTP are both required',
                                    }];
                            }
                            return [4 /*yield*/, this.authService.verifyOtpUnified(body.email, body.otp)];
                        case 1:
                            result = _a.sent();
                            if (!(result.success && !result.userExists && body.referralCode)) return [3 /*break*/, 5];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.referralService.recordReferral(body.referralCode, body.email, result.userId)];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            console.error('Failed to record referral during signup:', error_1);
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/, result];
                    }
                });
            });
        };
        /**
         * Refresh access token using refresh token
         * POST /auth/refresh
         * @body refresh_token: string (required)
         * @returns { success: boolean, access_token: string, refresh_token: string, message: string }
         */
        AuthController_1.prototype.refreshToken = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!body || !body.refresh_token) {
                        return [2 /*return*/, {
                                success: false,
                                message: 'Refresh token is required',
                            }];
                    }
                    return [2 /*return*/, this.authService.refreshTokens(body.refresh_token)];
                });
            });
        };
        /**
         * Logout user by invalidating refresh token
         * POST /auth/logout
         * @body email: string (required)
         * @returns { success: boolean, message: string }
         */
        AuthController_1.prototype.logout = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!body || !body.email) {
                        return [2 /*return*/, {
                                success: false,
                                message: 'Email is required',
                            }];
                    }
                    return [2 /*return*/, this.authService.logout(body.email)];
                });
            });
        };
        // ==================== USER DASHBOARD ====================
        /**
         * Get user dashboard data and profile information
         * POST /auth/dashboard
         * @body email: string (required)
         * @returns { success: boolean, user: { id, email, firstName, lastName, phoneNumber, dateOfBirth, createdAt } }
         */
        AuthController_1.prototype.getUserDashboard = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.email) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email is required to fetch dashboard',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.authService.getUserDashboard(body.email)];
                        case 2: return [2 /*return*/, _a.sent()];
                        case 3:
                            error_2 = _a.sent();
                            console.error('[AuthController.getUserDashboard] Fatal Error:', error_2);
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Internal server error occurred while fetching dashboard',
                                    error: error_2.message
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get complete dashboard data including applications and documents
         * POST /auth/dashboard-data
         * @body userId: string (required)
         * @returns { success: boolean, data: { applications: [], documents: [] } }
         */
        AuthController_1.prototype.getDashboardData = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var data, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.userId) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User ID is required',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.usersService.getUserDashboardData(body.userId)];
                        case 2:
                            data = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: data,
                                }];
                        case 3:
                            error_3 = _a.sent();
                            console.error('getDashboardData error:', error_3);
                            return [2 /*return*/, {
                                    success: false,
                                    message: "Failed to fetch dashboard data: ".concat(error_3.message),
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Update user details (name, phone, date of birth)
         * POST /auth/update-details
         * @body email: string (required), firstName: string (required), lastName: string (required),
         *       phoneNumber: string (required), dateOfBirth: string (required, DD-MM-YYYY format)
         * @returns { success: boolean, message: string, user?: { email, firstName, lastName, phoneNumber, dateOfBirth } }
         */
        AuthController_1.prototype.updateUserDetails = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!body || !body.email) {
                        return [2 /*return*/, {
                                success: false,
                                message: 'Email is required',
                            }];
                    }
                    return [2 /*return*/, this.authService.updateUserDetails(body.email, body.firstName, body.lastName, body.phoneNumber, body.dateOfBirth)];
                });
            });
        };
        // ==================== LOAN APPLICATIONS ====================
        /**
         * Create a new loan application
         * POST /auth/create-application
         * @body userId: string, bank: string, loanType: string, amount: number, purpose?: string
         * @returns { success: boolean, application?: LoanApplication }
         */
        AuthController_1.prototype.createApplication = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var amountVal, application, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.userId) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User ID is required',
                                    }];
                            }
                            amountVal = typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount;
                            if (isNaN(amountVal)) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Valid loan amount is required',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.usersService.createLoanApplication(body.userId, {
                                    bank: body.bank,
                                    loanType: body.loanType,
                                    amount: amountVal,
                                    purpose: body.purpose,
                                    courseType: body.courseType,
                                    country: body.country,
                                    university: body.university,
                                    annualFee: body.annualFee,
                                    livingCost: body.livingCost,
                                    coApplicant: body.coApplicant,
                                    income: body.income,
                                    collateral: body.collateral,
                                    firstName: body.firstName,
                                    lastName: body.lastName,
                                    email: body.email,
                                    phone: body.phone,
                                    dateOfBirth: body.dateOfBirth,
                                    address: body.address,
                                    notes: body.notes,
                                })];
                        case 2:
                            application = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    application: application,
                                }];
                        case 3:
                            error_4 = _a.sent();
                            console.error('Create application error:', error_4);
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Failed to create application',
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get user's loan applications
         * POST /auth/applications
         * @body userId: string (required)
         * @returns { success: boolean, applications: [] }
         */
        AuthController_1.prototype.getApplications = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var applications, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.userId) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User ID is required',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.usersService.getUserApplications(body.userId)];
                        case 2:
                            applications = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    applications: applications,
                                }];
                        case 3:
                            error_5 = _a.sent();
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Failed to fetch applications',
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Update loan application status
         * POST /auth/update-application/:id
         * @body status: string (required) - pending, processing, approved, rejected
         * @returns { success: boolean, application?: LoanApplication }
         */
        AuthController_1.prototype.updateApplication = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var application, error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.status) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Status is required',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.usersService.updateLoanApplicationStatus(id, body.status)];
                        case 2:
                            application = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    application: application,
                                }];
                        case 3:
                            error_6 = _a.sent();
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Failed to update application',
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Delete a loan application
         * DELETE /auth/application/:id
         * @returns { success: boolean, message: string }
         */
        AuthController_1.prototype.deleteApplication = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.usersService.deleteLoanApplication(id)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Application deleted successfully',
                                }];
                        case 2:
                            error_7 = _a.sent();
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Failed to delete application',
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // ==================== DOCUMENTS ====================
        /**
         * Upload or update document status
         * POST /auth/upload-document
         * @body userId: string, docType: string, uploaded: boolean, filePath?: string
         * @returns { success: boolean, document?: UserDocument }
         */
        AuthController_1.prototype.uploadDocument = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var document_1, error_8;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.userId || !body.docType) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User ID and Document Type are required',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.usersService.upsertUserDocument(body.userId, body.docType, {
                                    uploaded: body.uploaded,
                                    filePath: body.filePath,
                                    status: body.uploaded ? 'uploaded' : 'pending',
                                })];
                        case 2:
                            document_1 = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    document: document_1,
                                }];
                        case 3:
                            error_8 = _a.sent();
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Failed to upload document',
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get user's documents
         * POST /auth/documents
         * @body userId: string (required)
         * @returns { success: boolean, documents: [] }
         */
        AuthController_1.prototype.getDocuments = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var documents, error_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.userId) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User ID is required',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.usersService.getUserDocuments(body.userId)];
                        case 2:
                            documents = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    documents: documents,
                                }];
                        case 3:
                            error_9 = _a.sent();
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Failed to fetch documents',
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Delete a document
         * DELETE /auth/document/:userId/:docType
         * @returns { success: boolean, message: string }
         */
        AuthController_1.prototype.deleteDocument = function (userId, docType) {
            return __awaiter(this, void 0, void 0, function () {
                var error_10;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.usersService.deleteUserDocument(userId, docType)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Document deleted successfully',
                                }];
                        case 2:
                            error_10 = _a.sent();
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Failed to delete document',
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return AuthController_1;
    }());
    __setFunctionName(_classThis, "AuthController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _checkUserExists_decorators = [(0, common_1.Get)('check-user/:email')];
        _sendOtp_decorators = [(0, common_1.Post)('send-otp')];
        _verifyOtp_decorators = [(0, common_1.Post)('verify-otp')];
        _refreshToken_decorators = [(0, common_1.Post)('refresh')];
        _logout_decorators = [(0, common_1.Post)('logout')];
        _getUserDashboard_decorators = [(0, common_1.Post)('dashboard')];
        _getDashboardData_decorators = [(0, common_1.Post)('dashboard-data')];
        _updateUserDetails_decorators = [(0, common_1.Post)('update-details')];
        _createApplication_decorators = [(0, common_1.Post)('create-application')];
        _getApplications_decorators = [(0, common_1.Post)('applications')];
        _updateApplication_decorators = [(0, common_1.Post)('update-application/:id')];
        _deleteApplication_decorators = [(0, common_1.Delete)('application/:id')];
        _uploadDocument_decorators = [(0, common_1.Post)('upload-document')];
        _getDocuments_decorators = [(0, common_1.Post)('documents')];
        _deleteDocument_decorators = [(0, common_1.Delete)('document/:userId/:docType')];
        __esDecorate(_classThis, null, _checkUserExists_decorators, { kind: "method", name: "checkUserExists", static: false, private: false, access: { has: function (obj) { return "checkUserExists" in obj; }, get: function (obj) { return obj.checkUserExists; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendOtp_decorators, { kind: "method", name: "sendOtp", static: false, private: false, access: { has: function (obj) { return "sendOtp" in obj; }, get: function (obj) { return obj.sendOtp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyOtp_decorators, { kind: "method", name: "verifyOtp", static: false, private: false, access: { has: function (obj) { return "verifyOtp" in obj; }, get: function (obj) { return obj.verifyOtp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _refreshToken_decorators, { kind: "method", name: "refreshToken", static: false, private: false, access: { has: function (obj) { return "refreshToken" in obj; }, get: function (obj) { return obj.refreshToken; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _logout_decorators, { kind: "method", name: "logout", static: false, private: false, access: { has: function (obj) { return "logout" in obj; }, get: function (obj) { return obj.logout; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserDashboard_decorators, { kind: "method", name: "getUserDashboard", static: false, private: false, access: { has: function (obj) { return "getUserDashboard" in obj; }, get: function (obj) { return obj.getUserDashboard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDashboardData_decorators, { kind: "method", name: "getDashboardData", static: false, private: false, access: { has: function (obj) { return "getDashboardData" in obj; }, get: function (obj) { return obj.getDashboardData; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateUserDetails_decorators, { kind: "method", name: "updateUserDetails", static: false, private: false, access: { has: function (obj) { return "updateUserDetails" in obj; }, get: function (obj) { return obj.updateUserDetails; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createApplication_decorators, { kind: "method", name: "createApplication", static: false, private: false, access: { has: function (obj) { return "createApplication" in obj; }, get: function (obj) { return obj.createApplication; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApplications_decorators, { kind: "method", name: "getApplications", static: false, private: false, access: { has: function (obj) { return "getApplications" in obj; }, get: function (obj) { return obj.getApplications; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateApplication_decorators, { kind: "method", name: "updateApplication", static: false, private: false, access: { has: function (obj) { return "updateApplication" in obj; }, get: function (obj) { return obj.updateApplication; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteApplication_decorators, { kind: "method", name: "deleteApplication", static: false, private: false, access: { has: function (obj) { return "deleteApplication" in obj; }, get: function (obj) { return obj.deleteApplication; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _uploadDocument_decorators, { kind: "method", name: "uploadDocument", static: false, private: false, access: { has: function (obj) { return "uploadDocument" in obj; }, get: function (obj) { return obj.uploadDocument; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDocuments_decorators, { kind: "method", name: "getDocuments", static: false, private: false, access: { has: function (obj) { return "getDocuments" in obj; }, get: function (obj) { return obj.getDocuments; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteDocument_decorators, { kind: "method", name: "deleteDocument", static: false, private: false, access: { has: function (obj) { return "deleteDocument" in obj; }, get: function (obj) { return obj.deleteDocument; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthController = _classThis;
}();
exports.AuthController = AuthController;

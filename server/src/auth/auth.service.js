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
exports.AuthService = void 0;
var common_1 = require("@nestjs/common");
var AuthService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuthService = _classThis = /** @class */ (function () {
        function AuthService_1(usersService, emailService, jwtService, configService, eventEmitter) {
            this.usersService = usersService;
            this.emailService = emailService;
            this.jwtService = jwtService;
            this.configService = configService;
            this.eventEmitter = eventEmitter;
            this.otps = new Map();
            this.signupData = new Map();
        }
        /**
         * Generate both access and refresh tokens for a user
         */
        AuthService_1.prototype.generateTokens = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var payload, accessToken, refreshToken;
                return __generator(this, function (_a) {
                    payload = {
                        email: user.email,
                        sub: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phoneNumber: user.phoneNumber,
                        role: user.role
                    };
                    accessToken = this.jwtService.sign(payload, {
                        expiresIn: (this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION') || '30m'),
                    });
                    refreshToken = this.jwtService.sign(payload, {
                        expiresIn: (this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION') || '7d'),
                    });
                    // Store refresh token in database
                    // await this.usersService.updateRefreshToken(user.email, refreshToken);
                    return [2 /*return*/, {
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        }];
                });
            });
        };
        AuthService_1.prototype.sendOtp = function (email_1) {
            return __awaiter(this, arguments, void 0, function (email, isSignup, signupInfo) {
                var phoneRegex, digitsOnly, dobPattern, dobParts, day, month, year, dobDate, today, age, emailParts, username, domain, emailRegex, existingUser, otp, existingData;
                var _a, _b, _c, _d;
                if (isSignup === void 0) { isSignup = false; }
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            // Validate required fields for signup (only if provided)
                            if (isSignup && signupInfo) {
                                // Validate firstName if provided
                                if (signupInfo.firstName !== undefined) {
                                    if (signupInfo.firstName.trim() === '') {
                                        return [2 /*return*/, { success: false, message: 'Please enter your first name' }];
                                    }
                                    if (signupInfo.firstName.length > 30) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'First name must not exceed 30 characters',
                                            }];
                                    }
                                }
                                // Validate lastName if provided
                                if (signupInfo.lastName !== undefined) {
                                    if (signupInfo.lastName.trim() === '') {
                                        return [2 /*return*/, { success: false, message: 'Please enter your last name' }];
                                    }
                                    if (signupInfo.lastName.length > 30) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Last name must not exceed 30 characters',
                                            }];
                                    }
                                }
                                // Validate phoneNumber if provided
                                if (signupInfo.phoneNumber !== undefined) {
                                    if (signupInfo.phoneNumber.trim() === '') {
                                        return [2 /*return*/, { success: false, message: 'Please enter your phone number' }];
                                    }
                                    phoneRegex = /^[0-9+\s\-()]+$/;
                                    if (!phoneRegex.test(signupInfo.phoneNumber)) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Please enter a valid phone number',
                                            }];
                                    }
                                    digitsOnly = signupInfo.phoneNumber.replace(/[^0-9]/g, '');
                                    if (digitsOnly.length !== 10) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Phone number must be exactly 10 digits',
                                            }];
                                    }
                                }
                                // Validate dateOfBirth if provided
                                if (signupInfo.dateOfBirth !== undefined) {
                                    if (signupInfo.dateOfBirth.trim() === '') {
                                        return [2 /*return*/, { success: false, message: 'Please enter your date of birth' }];
                                    }
                                    dobPattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
                                    if (!dobPattern.test(signupInfo.dateOfBirth)) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Date of birth must be in DD-MM-YYYY format (e.g., 15-01-1990)',
                                            }];
                                    }
                                    dobParts = signupInfo.dateOfBirth.split('-');
                                    day = parseInt(dobParts[0], 10);
                                    month = parseInt(dobParts[1], 10);
                                    year = parseInt(dobParts[2], 10);
                                    dobDate = new Date(year, month - 1, day);
                                    // Check if it's a valid date
                                    if (dobDate.getFullYear() !== year ||
                                        dobDate.getMonth() !== month - 1 ||
                                        dobDate.getDate() !== day) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Please enter a valid date of birth',
                                            }];
                                    }
                                    today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (dobDate > today) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Date of birth cannot be in the future',
                                            }];
                                    }
                                    age = Math.floor((today.getTime() - dobDate.getTime()) /
                                        (365.25 * 24 * 60 * 60 * 1000));
                                    if (age < 18) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'You must be at least 18 years old to register',
                                            }];
                                    }
                                    // Check if date is reasonable (not more than 120 years ago)
                                    if (age > 120) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Please enter a valid date of birth',
                                            }];
                                    }
                                }
                            }
                            // Validate email format (for both signup and login)
                            if (!email || email.trim() === '') {
                                return [2 /*return*/, { success: false, message: 'Please enter your email address' }];
                            }
                            // Check for @ symbol first
                            if (!email.includes('@')) {
                                return [2 /*return*/, { success: false, message: 'Email must contain @ symbol' }];
                            }
                            emailParts = email.split('@');
                            if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email must have a valid domain (e.g., .com, .org)',
                                    }];
                            }
                            username = emailParts[0];
                            domain = emailParts[1];
                            // Validate username: minimum 8 characters
                            if (username.length < 8) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email username (before @) must be at least 8 characters long',
                                    }];
                            }
                            // Validate username: must include at least one alphabetical character (a-z)
                            if (!/[a-z]/.test(username)) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email username must include at least one alphabetical character (a-z)',
                                    }];
                            }
                            // Validate username: no capital letters allowed
                            if (/[A-Z]/.test(username)) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email username must not contain capital letters',
                                    }];
                            }
                            emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
                            if (!emailRegex.test(email.toLowerCase())) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Please enter a valid email address (e.g., username@example.com)',
                                    }];
                            }
                            return [4 /*yield*/, this.usersService.findOne(email)];
                        case 1:
                            existingUser = _e.sent();
                            if (isSignup && existingUser) {
                                // User trying to signup but already exists
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User already exists. Please login instead.',
                                        redirect: 'login',
                                    }];
                            }
                            if (!isSignup && !existingUser) {
                                // User trying to login but doesn't exist
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User not found. Please signup first.',
                                        redirect: 'signup',
                                    }];
                            }
                            otp = Math.floor(100000 + Math.random() * 900000).toString();
                            this.otps.set(email, otp);
                            console.log("[AuthService] New OTP generated for ".concat(email, ": ").concat(otp));
                            // Store signup data for registration - ONLY update if fields are provided
                            // This prevents overwriting existing data with 'undefined' during resend
                            if (isSignup && signupInfo) {
                                existingData = this.signupData.get(email) || {};
                                this.signupData.set(email, {
                                    firstName: (_a = signupInfo.firstName) !== null && _a !== void 0 ? _a : existingData.firstName,
                                    lastName: (_b = signupInfo.lastName) !== null && _b !== void 0 ? _b : existingData.lastName,
                                    phoneNumber: (_c = signupInfo.phoneNumber) !== null && _c !== void 0 ? _c : existingData.phoneNumber,
                                    dateOfBirth: (_d = signupInfo.dateOfBirth) !== null && _d !== void 0 ? _d : existingData.dateOfBirth,
                                });
                                console.log("[AuthService] Signup data updated/preserved for ".concat(email));
                            }
                            return [4 /*yield*/, this.emailService.sendOtp(email, otp)];
                        case 2:
                            _e.sent();
                            return [2 /*return*/, { success: true, message: 'OTP sent successfully' }];
                    }
                });
            });
        };
        AuthService_1.prototype.checkUserExists = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersService.findOne(email)];
                        case 1:
                            user = _a.sent();
                            if (user) {
                                return [2 /*return*/, { exists: true, message: 'User found' }];
                            }
                            else {
                                return [2 /*return*/, {
                                        exists: false,
                                        message: 'User not found. Please sign up first.',
                                    }];
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        // ==================== UNIFIED OTP FLOW ====================
        /**
         * Send OTP to email - works for both new and existing users
         * Step 1 of unified flow
         */
        AuthService_1.prototype.sendOtpUnified = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                var emailParts, username, domain, emailRegex, existingUser, otp, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Validate email format
                            if (!email || email.trim() === '') {
                                return [2 /*return*/, { success: false, message: 'Please enter your email address' }];
                            }
                            if (!email.includes('@')) {
                                return [2 /*return*/, { success: false, message: 'Email must contain @ symbol' }];
                            }
                            emailParts = email.split('@');
                            if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email must have a valid domain (e.g., .com, .org)',
                                    }];
                            }
                            username = emailParts[0];
                            domain = emailParts[1];
                            if (username.length < 8) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email username (before @) must be at least 8 characters long',
                                    }];
                            }
                            if (!/[a-z]/.test(username)) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email username must include at least one alphabetical character (a-z)',
                                    }];
                            }
                            if (/[A-Z]/.test(username)) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email username must not contain capital letters',
                                    }];
                            }
                            emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
                            if (!emailRegex.test(email.toLowerCase())) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Please enter a valid email address (e.g., username@example.com)',
                                    }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, this.usersService.findOne(email)];
                        case 2:
                            existingUser = _a.sent();
                            otp = Math.floor(100000 + Math.random() * 900000).toString();
                            this.otps.set(email, otp);
                            console.log("[AuthService] OTP generated for ".concat(email, ": ").concat(otp));
                            // Send OTP via email
                            return [4 /*yield*/, this.emailService.sendOtp(email, otp)];
                        case 3:
                            // Send OTP via email
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'OTP sent successfully',
                                    userExists: !!existingUser, // Return whether user exists or not
                                }];
                        case 4:
                            error_1 = _a.sent();
                            console.error('[AuthService] Database or Email error in sendOtpUnified:', error_1);
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Internal error: Could not connect to the database or email service. Please check your Railway environment variables and ensure the database is migrated.',
                                    error: error_1.message
                                }];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Verify OTP and handle both new and existing users
         * Step 2 of unified flow
         *
         * For existing users with complete details: return token + userExists=true, hasUserDetails=true
         * For existing users without details: return token + userExists=true, hasUserDetails=false
         * For new users: create user + return token + userExists=false, hasUserDetails=false
         */
        AuthService_1.prototype.verifyOtpUnified = function (email, otp) {
            return __awaiter(this, void 0, void 0, function () {
                var storedOtp, user, isNewUser, hasUserDetails, tokens, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            storedOtp = this.otps.get(email);
                            if (!storedOtp || storedOtp !== otp) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Invalid or expired OTP. Please try again.',
                                    }];
                            }
                            // Invalidate OTP after verification
                            this.otps.delete(email);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 6, , 7]);
                            return [4 /*yield*/, this.usersService.findOne(email)];
                        case 2:
                            user = _a.sent();
                            isNewUser = !user;
                            if (!!user) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.usersService.create({ email: email })];
                        case 3:
                            // Create new user with only email; optional fields omitted
                            user = _a.sent();
                            console.log("[AuthService] New user created: ".concat(email));
                            _a.label = 4;
                        case 4:
                            hasUserDetails = !!(user.firstName &&
                                user.lastName &&
                                user.phoneNumber &&
                                user.dateOfBirth);
                            return [4 /*yield*/, this.generateTokens(user)];
                        case 5:
                            tokens = _a.sent();
                            // Notify other modules (like Chat) about user activity
                            this.eventEmitter.emit('user.login', {
                                email: user.email,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                phoneNumber: user.phoneNumber,
                                isNewUser: isNewUser
                            });
                            return [2 /*return*/, {
                                    success: true,
                                    message: isNewUser ? 'Signup successful. Please complete your profile.' : 'Login successful.',
                                    access_token: tokens.access_token,
                                    refresh_token: tokens.refresh_token,
                                    userId: user.id,
                                    userExists: !isNewUser,
                                    hasUserDetails: hasUserDetails,
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    userId: user.id,
                                    role: user.role,
                                }];
                        case 6:
                            error_2 = _a.sent();
                            console.error('[AuthService] Error in verifyOtpUnified:', error_2);
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'An error occurred during verification. Please try again.',
                                }];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Refresh access token using refresh token
         */
        AuthService_1.prototype.refreshTokens = function (refreshToken) {
            return __awaiter(this, void 0, void 0, function () {
                var payload, user, tokens, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, this.jwtService.verifyAsync(refreshToken)];
                        case 1:
                            payload = _a.sent();
                            return [4 /*yield*/, this.usersService.findOne(payload.email)];
                        case 2:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.UnauthorizedException('User not found');
                            }
                            return [4 /*yield*/, this.generateTokens(user)];
                        case 3:
                            tokens = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Tokens refreshed successfully',
                                    access_token: tokens.access_token,
                                    refresh_token: tokens.refresh_token,
                                }];
                        case 4:
                            error_3 = _a.sent();
                            if (error_3 instanceof common_1.UnauthorizedException) {
                                throw error_3;
                            }
                            if (error_3.name === 'TokenExpiredError') {
                                throw new common_1.UnauthorizedException('Refresh token has expired. Please login again.');
                            }
                            throw new common_1.UnauthorizedException('Invalid refresh token');
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Logout user by invalidating refresh token
         */
        AuthService_1.prototype.logout = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    // Feature disabled
                    return [2 /*return*/, {
                            success: true,
                            message: 'Logged out successfully',
                        }];
                });
            });
        };
        AuthService_1.prototype.getUserDashboard = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                var user, formattedDob, date, day, month, year, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("[AuthService.getUserDashboard] Fetching dashboard for: ".concat(email));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.usersService.findOne(email)];
                        case 2:
                            user = _a.sent();
                            if (!user) {
                                console.warn("[AuthService.getUserDashboard] User not found: ".concat(email));
                                throw new common_1.UnauthorizedException('User not found');
                            }
                            console.log("[AuthService.getUserDashboard] User found: ".concat(user.id, ", DOB: ").concat(user.dateOfBirth));
                            formattedDob = null;
                            if (user.dateOfBirth) {
                                try {
                                    date = new Date(user.dateOfBirth);
                                    if (!isNaN(date.getTime())) {
                                        day = String(date.getDate()).padStart(2, '0');
                                        month = String(date.getMonth() + 1).padStart(2, '0');
                                        year = date.getFullYear();
                                        formattedDob = "".concat(day, "-").concat(month, "-").concat(year);
                                        console.log("[AuthService.getUserDashboard] Formatted DOB: ".concat(formattedDob));
                                    }
                                    else {
                                        console.warn("[AuthService.getUserDashboard] Invalid DOB in DB: ".concat(user.dateOfBirth));
                                    }
                                }
                                catch (e) {
                                    console.error('[AuthService.getUserDashboard] DOB parsing failed:', e);
                                }
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    user: {
                                        id: user.id,
                                        email: user.email,
                                        firstName: user.firstName,
                                        lastName: user.lastName,
                                        phoneNumber: user.phoneNumber,
                                        dateOfBirth: formattedDob,
                                        createdAt: user.createdAt,
                                    }
                                }];
                        case 3:
                            error_4 = _a.sent();
                            console.error('[AuthService.getUserDashboard] Error:', error_4);
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Failed to fetch user dashboard profile',
                                    error: error_4.message
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        AuthService_1.prototype.updateUserDetails = function (email, firstName, lastName, phoneNumber, dateOfBirth) {
            return __awaiter(this, void 0, void 0, function () {
                var existingUser, phoneRegex, digitsOnly, dobPattern, dobParts, day, month, year, dobDate, today, age, user, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersService.findOne(email)];
                        case 1:
                            existingUser = _a.sent();
                            if (!existingUser) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User does not exist. Please check your email address or sign up first.',
                                    }];
                            }
                            // Validate firstName
                            if (!firstName || firstName.trim() === '') {
                                return [2 /*return*/, { success: false, message: 'Please enter your first name' }];
                            }
                            if (firstName.length > 30) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'First name must not exceed 30 characters',
                                    }];
                            }
                            // Validate lastName
                            if (!lastName || lastName.trim() === '') {
                                return [2 /*return*/, { success: false, message: 'Please enter your last name' }];
                            }
                            if (lastName.length > 30) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Last name must not exceed 30 characters',
                                    }];
                            }
                            // Validate phoneNumber
                            if (!phoneNumber || phoneNumber.trim() === '') {
                                return [2 /*return*/, { success: false, message: 'Please enter your phone number' }];
                            }
                            phoneRegex = /^[0-9+\s\-()]+$/;
                            if (!phoneRegex.test(phoneNumber)) {
                                return [2 /*return*/, { success: false, message: 'Please enter a valid phone number' }];
                            }
                            digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
                            if (digitsOnly.length !== 10) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Phone number must be exactly 10 digits',
                                    }];
                            }
                            // Validate dateOfBirth
                            if (!dateOfBirth || dateOfBirth.trim() === '') {
                                return [2 /*return*/, { success: false, message: 'Please enter your date of birth' }];
                            }
                            dobPattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
                            if (!dobPattern.test(dateOfBirth)) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Date of birth must be in DD-MM-YYYY format (e.g., 15-01-1990)',
                                    }];
                            }
                            dobParts = dateOfBirth.split('-');
                            day = parseInt(dobParts[0], 10);
                            month = parseInt(dobParts[1], 10);
                            year = parseInt(dobParts[2], 10);
                            dobDate = new Date(year, month - 1, day);
                            if (dobDate.getFullYear() !== year ||
                                dobDate.getMonth() !== month - 1 ||
                                dobDate.getDate() !== day) {
                                return [2 /*return*/, { success: false, message: 'Please enter a valid date of birth' }];
                            }
                            today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (dobDate > today) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Date of birth cannot be in the future',
                                    }];
                            }
                            age = Math.floor((today.getTime() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                            if (age < 18) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'You must be at least 18 years old to register',
                                    }];
                            }
                            if (age > 120) {
                                return [2 /*return*/, { success: false, message: 'Please enter a valid date of birth' }];
                            }
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.usersService.updateUserDetails(email, firstName, lastName, phoneNumber, dateOfBirth)];
                        case 3:
                            user = _a.sent();
                            if (!user) {
                                return [2 /*return*/, { success: false, message: 'User not found' }];
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Profile updated successfully',
                                    user: {
                                        email: user.email,
                                        firstName: user.firstName,
                                        lastName: user.lastName,
                                        phoneNumber: user.phoneNumber,
                                        dateOfBirth: user.dateOfBirth,
                                        userId: user.id,
                                    },
                                }];
                        case 4:
                            error_5 = _a.sent();
                            console.error('Error updating user details:', error_5);
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Failed to update profile. Please try again or contact support.',
                                }];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        return AuthService_1;
    }());
    __setFunctionName(_classThis, "AuthService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
}();
exports.AuthService = AuthService;

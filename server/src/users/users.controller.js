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
exports.UsersController = void 0;
var common_1 = require("@nestjs/common");
var admin_guard_1 = require("../auth/admin.guard");
var super_admin_guard_1 = require("../auth/super-admin.guard");
var UsersController = function () {
    var _classDecorators = [(0, common_1.Controller)('users')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getProfile_decorators;
    var _listUsers_decorators;
    var _makeAdmin_decorators;
    var _sendAdminEmail_decorators;
    var _adminCreateUser_decorators;
    var _adminUpdateUser_decorators;
    var UsersController = _classThis = /** @class */ (function () {
        function UsersController_1(usersService, emailService) {
            this.usersService = (__runInitializers(this, _instanceExtraInitializers), usersService);
            this.emailService = emailService;
        }
        UsersController_1.prototype.getProfile = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var user, formattedDOB, date, day, month, year;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.email) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email is required',
                                    }];
                            }
                            return [4 /*yield*/, this.usersService.findOne(body.email)];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User not found',
                                    }];
                            }
                            formattedDOB = '';
                            if (user.dateOfBirth) {
                                date = new Date(user.dateOfBirth);
                                day = String(date.getDate()).padStart(2, '0');
                                month = String(date.getMonth() + 1).padStart(2, '0');
                                year = date.getFullYear();
                                formattedDOB = "".concat(day, "-").concat(month, "-").concat(year);
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    user: {
                                        id: user.id,
                                        email: user.email,
                                        firstName: user.firstName || '',
                                        lastName: user.lastName || '',
                                        phoneNumber: user.phoneNumber || '',
                                        dateOfBirth: formattedDOB,
                                        mobile: user.mobile,
                                        role: user.role,
                                    },
                                }];
                    }
                });
            });
        };
        // Admin: list all users (limited fields)
        UsersController_1.prototype.listUsers = function () {
            return __awaiter(this, void 0, void 0, function () {
                var users, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.usersService.findAll()];
                        case 1:
                            users = _a.sent();
                            if (!users)
                                return [2 /*return*/, { success: true, data: [] }];
                            return [2 /*return*/, {
                                    success: true,
                                    data: users.map(function (u) { return ({
                                        id: (u === null || u === void 0 ? void 0 : u.id) || '',
                                        email: (u === null || u === void 0 ? void 0 : u.email) || '',
                                        firstName: (u === null || u === void 0 ? void 0 : u.firstName) || '',
                                        lastName: (u === null || u === void 0 ? void 0 : u.lastName) || '',
                                        role: (u === null || u === void 0 ? void 0 : u.role) || 'user',
                                        createdAt: (u === null || u === void 0 ? void 0 : u.createdAt) || new Date().toISOString()
                                    }); })
                                }];
                        case 2:
                            error_1 = _a.sent();
                            console.error('Error in listUsers:', error_1);
                            return [2 /*return*/, {
                                    success: false,
                                    message: error_1.message || 'Failed to list users',
                                    data: []
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        UsersController_1.prototype.makeAdmin = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var allowedRoles, user, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.email || !body.role) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'Email and role are required',
                                    }];
                            }
                            allowedRoles = ['admin', 'user', 'staff', 'super_admin', 'agent', 'bank'];
                            if (!allowedRoles.includes(body.role)) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: "Invalid role. Allowed roles: ".concat(allowedRoles.join(', ')),
                                    }];
                            }
                            return [4 /*yield*/, this.usersService.findOne(body.email)];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                return [2 /*return*/, {
                                        success: false,
                                        message: 'User not found',
                                    }];
                            }
                            return [4 /*yield*/, this.usersService.updateUserRole(body.email, body.role)];
                        case 2:
                            updated = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: "User ".concat(body.email, " role updated to '").concat(body.role, "'"),
                                    user: {
                                        id: updated.id,
                                        email: updated.email,
                                        firstName: updated.firstName,
                                        lastName: updated.lastName,
                                        role: updated.role,
                                    },
                                }];
                    }
                });
            });
        };
        UsersController_1.prototype.sendAdminEmail = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var users, filteredUsers, _i, filteredUsers_1, u, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.subject || !body.content) {
                                return [2 /*return*/, { success: false, message: 'Subject and content are required' }];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 11, , 12]);
                            if (!(body.isBulk && body.role)) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.usersService.findAll()];
                        case 2:
                            users = _a.sent();
                            filteredUsers = users.filter(function (u) { return u.role === body.role; });
                            _i = 0, filteredUsers_1 = filteredUsers;
                            _a.label = 3;
                        case 3:
                            if (!(_i < filteredUsers_1.length)) return [3 /*break*/, 6];
                            u = filteredUsers_1[_i];
                            return [4 /*yield*/, this.emailService.sendMail(u.email, body.subject, "<div style=\"font-family: sans-serif; padding: 20px;\">".concat(body.content, "</div>"), body.content)];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6: return [2 /*return*/, {
                                success: true,
                                message: "Email sent to ".concat(filteredUsers.length, " users with role '").concat(body.role, "'")
                            }];
                        case 7:
                            if (!body.to) return [3 /*break*/, 9];
                            return [4 /*yield*/, this.emailService.sendMail(body.to, body.subject, "<div style=\"font-family: sans-serif; padding: 20px;\">".concat(body.content, "</div>"), body.content)];
                        case 8:
                            _a.sent();
                            return [2 /*return*/, { success: true, message: "Email sent to ".concat(body.to) }];
                        case 9: return [2 /*return*/, { success: false, message: 'Recipient email or role is required' }];
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            error_2 = _a.sent();
                            console.error('Error sending admin email:', error_2);
                            return [2 /*return*/, { success: false, message: 'Failed to send email' }];
                        case 12: return [2 /*return*/];
                    }
                });
            });
        };
        UsersController_1.prototype.adminCreateUser = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, newUser, emailErr_1, responseUser, finalResponse, error_3, errorResponse;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log('=== ADMIN CREATE USER START ===');
                            console.log('Request body:', body);
                            if (!body || !body.email || !body.role) {
                                console.log('Validation failed: missing email or role');
                                return [2 /*return*/, { success: false, message: 'Email and role are required' }];
                            }
                            return [4 /*yield*/, this.usersService.findOne(body.email)];
                        case 1:
                            existing = _a.sent();
                            if (existing) {
                                return [2 /*return*/, { success: false, message: 'User with this email already exists' }];
                            }
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 8, , 9]);
                            return [4 /*yield*/, this.usersService.create({
                                    email: body.email,
                                    firstName: body.firstName,
                                    lastName: body.lastName,
                                    mobile: body.mobile,
                                    role: body.role,
                                    password: Math.random().toString(36).slice(-12), // Generate a dummy password
                                })];
                        case 3:
                            newUser = _a.sent();
                            console.log('New user created:', {
                                fullUser: JSON.stringify(newUser),
                                hasId: !!(newUser === null || newUser === void 0 ? void 0 : newUser.id),
                                id: newUser === null || newUser === void 0 ? void 0 : newUser.id,
                                keys: Object.keys(newUser || {})
                            });
                            _a.label = 4;
                        case 4:
                            _a.trys.push([4, 6, , 7]);
                            return [4 /*yield*/, this.emailService.sendMail(newUser.email, "Welcome to VidhyaLoan - Your ".concat(body.role, " Account"), "<div style=\"font-family: sans-serif; padding: 20px;\">\n                        <h2>Welcome to the Matrix, ".concat(body.firstName, "!</h2>\n                        <p>Your account as an <strong>").concat(body.role, "</strong> has been created by the administrator.</p>\n                        <p>You can now log in using your email: <strong>").concat(body.email, "</strong></p>\n                        <p>Proceed to the dashboard to complete your profile.</p>\n                    </div>"), "Welcome to VidhyaLoan! Your ".concat(body.role, " account has been created."))];
                        case 5:
                            _a.sent();
                            return [3 /*break*/, 7];
                        case 6:
                            emailErr_1 = _a.sent();
                            console.warn('Email sending failed (non-blocking):', emailErr_1 === null || emailErr_1 === void 0 ? void 0 : emailErr_1.message);
                            return [3 /*break*/, 7];
                        case 7:
                            responseUser = {
                                id: newUser === null || newUser === void 0 ? void 0 : newUser.id,
                                email: newUser === null || newUser === void 0 ? void 0 : newUser.email,
                                firstName: newUser === null || newUser === void 0 ? void 0 : newUser.firstName,
                                lastName: newUser === null || newUser === void 0 ? void 0 : newUser.lastName,
                                role: newUser === null || newUser === void 0 ? void 0 : newUser.role
                            };
                            console.log('Sending response:', { success: true, user: responseUser });
                            finalResponse = {
                                success: true,
                                message: 'User created successfully',
                                user: responseUser
                            };
                            console.log('=== ADMIN CREATE USER END ===');
                            console.log('Final Response:', JSON.stringify(finalResponse, null, 2));
                            return [2 /*return*/, finalResponse];
                        case 8:
                            error_3 = _a.sent();
                            console.error('=== ERROR IN ADMIN CREATE USER ===');
                            console.error('Error creating user by admin:', error_3);
                            errorResponse = { success: false, message: 'Failed to create user', error: error_3 === null || error_3 === void 0 ? void 0 : error_3.message };
                            console.error('Error Response:', JSON.stringify(errorResponse, null, 2));
                            return [2 /*return*/, errorResponse];
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        UsersController_1.prototype.adminUpdateUser = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!body || !body.email) {
                                return [2 /*return*/, { success: false, message: 'Email is required' }];
                            }
                            return [4 /*yield*/, this.usersService.updateUserDetails(body.email, body.firstName, body.lastName, body.phoneNumber, body.dateOfBirth)];
                        case 1:
                            updated = _a.sent();
                            return [2 /*return*/, { success: true, message: 'User updated successfully', user: updated }];
                    }
                });
            });
        };
        return UsersController_1;
    }());
    __setFunctionName(_classThis, "UsersController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getProfile_decorators = [(0, common_1.Post)('profile')];
        _listUsers_decorators = [(0, common_1.Get)('admin/list'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard)];
        _makeAdmin_decorators = [(0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard), (0, common_1.Post)('make-admin')];
        _sendAdminEmail_decorators = [(0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, common_1.Post)('admin/send-email')];
        _adminCreateUser_decorators = [(0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, common_1.Post)('admin/create')];
        _adminUpdateUser_decorators = [(0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, common_1.Post)('admin/update-details')];
        __esDecorate(_classThis, null, _getProfile_decorators, { kind: "method", name: "getProfile", static: false, private: false, access: { has: function (obj) { return "getProfile" in obj; }, get: function (obj) { return obj.getProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listUsers_decorators, { kind: "method", name: "listUsers", static: false, private: false, access: { has: function (obj) { return "listUsers" in obj; }, get: function (obj) { return obj.listUsers; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _makeAdmin_decorators, { kind: "method", name: "makeAdmin", static: false, private: false, access: { has: function (obj) { return "makeAdmin" in obj; }, get: function (obj) { return obj.makeAdmin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendAdminEmail_decorators, { kind: "method", name: "sendAdminEmail", static: false, private: false, access: { has: function (obj) { return "sendAdminEmail" in obj; }, get: function (obj) { return obj.sendAdminEmail; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _adminCreateUser_decorators, { kind: "method", name: "adminCreateUser", static: false, private: false, access: { has: function (obj) { return "adminCreateUser" in obj; }, get: function (obj) { return obj.adminCreateUser; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _adminUpdateUser_decorators, { kind: "method", name: "adminUpdateUser", static: false, private: false, access: { has: function (obj) { return "adminUpdateUser" in obj; }, get: function (obj) { return obj.adminUpdateUser; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersController = _classThis;
}();
exports.UsersController = UsersController;

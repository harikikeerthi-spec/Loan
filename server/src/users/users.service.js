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
exports.UsersService = void 0;
var common_1 = require("@nestjs/common");
var UsersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UsersService = _classThis = /** @class */ (function () {
        function UsersService_1(supabase) {
            this.supabase = supabase;
        }
        Object.defineProperty(UsersService_1.prototype, "db", {
            get: function () {
                return this.supabase.getClient();
            },
            enumerable: false,
            configurable: true
        });
        UsersService_1.prototype.parseDate = function (dateStr) {
            if (!dateStr)
                return null;
            // Try native parsing first (e.g., ISO, YYYY-MM-DD)
            var d = new Date(dateStr);
            if (!isNaN(d.getTime()))
                return d.toISOString();
            // Try DD-MM-YYYY or DD/MM/YYYY
            var parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
                var day = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10) - 1;
                var year = parseInt(parts[2], 10);
                // Simple validation for numbers
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    d = new Date(year, month, day);
                    if (!isNaN(d.getTime()))
                        return d.toISOString();
                }
            }
            return null;
        };
        UsersService_1.prototype.safeISO = function (dateSource) {
            if (!dateSource)
                return new Date().toISOString();
            var d = dateSource instanceof Date ? dateSource : new Date(dateSource);
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        };
        UsersService_1.prototype.findOne = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error, e_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.db.from('User').select('*').eq('email', email).single()];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                                console.error("[UsersService.findOne] Supabase error for ".concat(email, ":"), error);
                            }
                            return [2 /*return*/, data];
                        case 2:
                            e_1 = _b.sent();
                            console.error("[UsersService.findOne] Fatal error for ".concat(email, ":"), e_1);
                            throw e_1;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        UsersService_1.prototype.findById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.from('User').select('*').eq('id', id).single()];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        UsersService_1.prototype.findByMobile = function (mobile) {
            return __awaiter(this, void 0, void 0, function () {
                var cleanMobile, cleanMobileNoCountry, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cleanMobile = mobile.replace(/\D/g, '');
                            cleanMobileNoCountry = cleanMobile.length > 10 && cleanMobile.startsWith('91')
                                ? cleanMobile.substring(2)
                                : cleanMobile;
                            return [4 /*yield*/, this.db
                                    .from('User')
                                    .select('*')
                                    .or("mobile.eq.".concat(mobile, ",phoneNumber.eq.").concat(mobile, ",mobile.eq.").concat(cleanMobileNoCountry, ",phoneNumber.eq.").concat(cleanMobileNoCountry, ",mobile.ilike.%").concat(cleanMobileNoCountry, ",phoneNumber.ilike.%").concat(cleanMobileNoCountry))
                                    .limit(1)
                                    .single()];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        UsersService_1.prototype.create = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var dobDate, _a, user, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            dobDate = this.parseDate(data.dateOfBirth);
                            return [4 /*yield*/, this.db
                                    .from('User')
                                    .insert({
                                    email: data.email,
                                    firstName: data.firstName || null,
                                    lastName: data.lastName || null,
                                    phoneNumber: data.phoneNumber || null,
                                    dateOfBirth: dobDate,
                                    mobile: data.mobile || '',
                                    password: data.password || '',
                                    role: data.role || 'user',
                                })
                                    .select()
                                    .single()];
                        case 1:
                            _a = _b.sent(), user = _a.data, error = _a.error;
                            if (error) {
                                console.error('Supabase insert error:', error);
                                throw error;
                            }
                            console.log('User created in DB:', { user: user, keys: Object.keys(user || {}), hasId: !!(user === null || user === void 0 ? void 0 : user.id) });
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        UsersService_1.prototype.findAll = function () {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.from('User').select('*')];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data || []];
                    }
                });
            });
        };
        UsersService_1.prototype.updateUserDetails = function (email, firstName, lastName, phoneNumber, dateOfBirth) {
            return __awaiter(this, void 0, void 0, function () {
                var dobDate, _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            dobDate = this.parseDate(dateOfBirth);
                            return [4 /*yield*/, this.db
                                    .from('User')
                                    .update({ firstName: firstName, lastName: lastName, phoneNumber: phoneNumber, dateOfBirth: dobDate })
                                    .eq('email', email)
                                    .select()
                                    .single()];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        UsersService_1.prototype.updateRefreshToken = function (email, refreshToken) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('User')
                                .update({ refreshToken: refreshToken })
                                .eq('email', email)
                                .select()
                                .single()];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        UsersService_1.prototype.updateUserRole = function (email, role) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('User')
                                .update({ role: role })
                                .eq('email', email)
                                .select()
                                .single()];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        // Loan Application Methods
        UsersService_1.prototype.createLoanApplication = function (userId, data) {
            return __awaiter(this, void 0, void 0, function () {
                var now, prefix, applicationNumber, estimatedCompletionAt, _a, application, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            now = new Date().toISOString();
                            prefix = ({ education: 'EDU', home: 'HME', personal: 'PRS', business: 'BUS', vehicle: 'VEH' })[data.loanType] || 'APP';
                            applicationNumber = "".concat(prefix).concat(Date.now().toString(36).toUpperCase()).concat(Math.random().toString(36).substring(2, 6).toUpperCase());
                            estimatedCompletionAt = new Date();
                            estimatedCompletionAt.setDate(estimatedCompletionAt.getDate() + 14);
                            return [4 /*yield*/, this.db
                                    .from('LoanApplication')
                                    .insert({
                                    applicationNumber: applicationNumber,
                                    userId: userId,
                                    bank: data.bank,
                                    loanType: data.loanType,
                                    amount: data.amount,
                                    purpose: data.purpose || null,
                                    universityName: data.university || null,
                                    country: data.country || null,
                                    courseName: data.courseType || null,
                                    firstName: data.firstName || null,
                                    lastName: data.lastName || null,
                                    email: data.email || null,
                                    phone: data.phone || null,
                                    dateOfBirth: this.parseDate(data.dateOfBirth),
                                    address: data.address || null,
                                    hasCoApplicant: !!data.coApplicant && data.coApplicant !== 'none',
                                    coApplicantRelation: data.coApplicant !== 'none' ? data.coApplicant : null,
                                    coApplicantIncome: data.income ? parseFloat(data.income) : null,
                                    hasCollateral: !!data.collateral && data.collateral !== 'no',
                                    collateralType: data.collateral !== 'no' ? data.collateral : null,
                                    remarks: data.notes || null,
                                    status: 'pending',
                                    stage: 'application_submitted',
                                    progress: 10,
                                    submittedAt: now,
                                    estimatedCompletionAt: estimatedCompletionAt.toISOString(),
                                    updatedAt: now,
                                })
                                    .select()
                                    .single()];
                        case 1:
                            _a = _b.sent(), application = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, application];
                    }
                });
            });
        };
        UsersService_1.prototype.getUserApplications = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user, email, query, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findById(userId)];
                        case 1:
                            user = _a.sent();
                            email = user === null || user === void 0 ? void 0 : user.email;
                            query = this.db
                                .from('LoanApplication')
                                .select('*')
                                .order('id', { ascending: false });
                            if (email) {
                                query = query.or("userId.eq.".concat(userId, ",email.eq.").concat(email));
                            }
                            else {
                                query = query.eq('userId', userId);
                            }
                            return [4 /*yield*/, query];
                        case 2:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data || []];
                    }
                });
            });
        };
        UsersService_1.prototype.updateLoanApplicationStatus = function (applicationId, status) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('LoanApplication')
                                .update({ status: status })
                                .eq('id', applicationId)
                                .select()
                                .single()];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        UsersService_1.prototype.deleteLoanApplication = function (applicationId) {
            return __awaiter(this, void 0, void 0, function () {
                var error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('LoanApplication')
                                .delete()
                                .eq('id', applicationId)];
                        case 1:
                            error = (_a.sent()).error;
                            if (error)
                                throw error;
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        // Document Methods
        UsersService_1.prototype.upsertUserDocument = function (userId, docType, data) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, payload, _a, updated, error, _b, created, error;
                var _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('UserDocument')
                                .select('id')
                                .eq('userId', userId)
                                .eq('docType', docType)
                                .single()];
                        case 1:
                            existing = _d.sent();
                            payload = {
                                uploaded: data.uploaded,
                                status: data.status || 'pending',
                                filePath: data.filePath || null,
                                uploadedAt: data.uploaded ? new Date().toISOString() : null,
                            };
                            if (data.digilockerTxId !== undefined)
                                payload.digilockerTxId = data.digilockerTxId;
                            if (data.verifiedAt !== undefined)
                                payload.verifiedAt = (_c = data.verifiedAt) === null || _c === void 0 ? void 0 : _c.toISOString();
                            if (data.verificationMetadata !== undefined)
                                payload.verificationMetadata = data.verificationMetadata;
                            if (!existing.data) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.db
                                    .from('UserDocument')
                                    .update(payload)
                                    .eq('id', existing.data.id)
                                    .select()
                                    .single()];
                        case 2:
                            _a = _d.sent(), updated = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, updated];
                        case 3: return [4 /*yield*/, this.db
                                .from('UserDocument')
                                .insert(__assign({ userId: userId, docType: docType }, payload))
                                .select()
                                .single()];
                        case 4:
                            _b = _d.sent(), created = _b.data, error = _b.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, created];
                    }
                });
            });
        };
        UsersService_1.prototype.getUserDocuments = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('UserDocument')
                                .select('*')
                                .eq('userId', userId)
                                .order('docType', { ascending: true })];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data || []];
                    }
                });
            });
        };
        UsersService_1.prototype.deleteUserDocument = function (userId, docType) {
            return __awaiter(this, void 0, void 0, function () {
                var error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('UserDocument')
                                .delete()
                                .eq('userId', userId)
                                .eq('docType', docType)];
                        case 1:
                            error = (_a.sent()).error;
                            if (error)
                                throw error;
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        // Get user dashboard data with all applications, documents and full activity feed
        UsersService_1.prototype.getUserDashboardData = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var applications, documents, userWithActivity, inquiries, activity, _i, applications_1, app, ts, _a, documents_1, doc, ts, _b, inquiries_1, inq, _c, _d, check, _e, _f, interview, _g, _h, post, _j, _k, comment, sanitizedUser, error_1;
                return __generator(this, function (_l) {
                    switch (_l.label) {
                        case 0:
                            _l.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, this.getUserApplications(userId)];
                        case 1:
                            applications = (_l.sent()) || [];
                            return [4 /*yield*/, this.getUserDocuments(userId)];
                        case 2:
                            documents = (_l.sent()) || [];
                            return [4 /*yield*/, this.db
                                    .from('User')
                                    .select("*, eligibilityChecks:LoanEligibilityCheck(*), visaMockInterviews:VisaMockInterviewResult(*), forumPosts:ForumPost(*), forumComments:ForumComment(*), universityInquiries:UniversityInquiry(*)")
                                    .eq('id', userId)
                                    .single()];
                        case 3:
                            userWithActivity = (_l.sent()).data;
                            inquiries = (userWithActivity === null || userWithActivity === void 0 ? void 0 : userWithActivity.universityInquiries) || [];
                            activity = [];
                            for (_i = 0, applications_1 = applications; _i < applications_1.length; _i++) {
                                app = applications_1[_i];
                                ts = app.submittedAt || app.date;
                                activity.push({
                                    type: 'application',
                                    title: "Loan Application \u2014 ".concat(app.bank),
                                    description: "\u20B9".concat((app.amount || 0).toLocaleString('en-IN'), " ").concat(app.loanType || '').concat(app.universityName ? " for ".concat(app.universityName) : '', ". Status: ").concat(app.status || 'pending'),
                                    timestamp: this.safeISO(ts),
                                    link: '/dashboard',
                                });
                            }
                            for (_a = 0, documents_1 = documents; _a < documents_1.length; _a++) {
                                doc = documents_1[_a];
                                if (doc.uploaded) {
                                    ts = doc.uploadedAt || doc.createdAt;
                                    activity.push({
                                        type: 'upload',
                                        title: "Document Uploaded",
                                        description: "".concat((doc.docType || '').replace('_', ' '), " uploaded successfully"),
                                        timestamp: this.safeISO(ts),
                                        link: '/document-vault',
                                    });
                                }
                            }
                            for (_b = 0, inquiries_1 = inquiries; _b < inquiries_1.length; _b++) {
                                inq = inquiries_1[_b];
                                activity.push({
                                    type: inq.type === 'callback' ? 'callback' : 'inquiry',
                                    title: inq.type === 'callback' ? 'Callback Requested' : 'Fasttrack Application',
                                    description: "University: ".concat(inq.universityName || 'N/A', ". Status: ").concat(inq.status || 'pending'),
                                    timestamp: this.safeISO(inq.createdAt),
                                    link: '/explore',
                                });
                            }
                            if (userWithActivity === null || userWithActivity === void 0 ? void 0 : userWithActivity.eligibilityChecks) {
                                for (_c = 0, _d = userWithActivity.eligibilityChecks; _c < _d.length; _c++) {
                                    check = _d[_c];
                                    activity.push({
                                        type: 'eligibility',
                                        title: "Eligibility Result: ".concat(check.status || 'Success'),
                                        description: "Score: ".concat(check.score || 0, "% for loan of \u20B9").concat((check.loan || 0).toLocaleString('en-IN')),
                                        timestamp: this.safeISO(check.createdAt),
                                        link: '/loan-eligibility',
                                    });
                                }
                            }
                            if (userWithActivity === null || userWithActivity === void 0 ? void 0 : userWithActivity.visaMockInterviews) {
                                for (_e = 0, _f = userWithActivity.visaMockInterviews; _e < _f.length; _e++) {
                                    interview = _f[_e];
                                    activity.push({
                                        type: 'visa_mock',
                                        title: "Visa Mock Interview \u2014 ".concat(interview.visaType || 'F1'),
                                        description: "Likelihood: ".concat(interview.approvalLikelihood || 'High', ". Risk: ").concat(interview.overallRisk || 'Low', ". Score: ").concat(interview.overallScore || 0, "/10"),
                                        timestamp: this.safeISO(interview.createdAt),
                                        link: '/visa-mock',
                                    });
                                }
                            }
                            if (userWithActivity === null || userWithActivity === void 0 ? void 0 : userWithActivity.forumPosts) {
                                for (_g = 0, _h = userWithActivity.forumPosts; _g < _h.length; _g++) {
                                    post = _h[_g];
                                    activity.push({
                                        type: 'forum_post',
                                        title: "Forum Post: ".concat(post.title || 'Untitled'),
                                        description: (post.content || '').substring(0, 100) + '...',
                                        timestamp: this.safeISO(post.createdAt),
                                        link: "/community/forum/".concat(post.id),
                                    });
                                }
                            }
                            if (userWithActivity === null || userWithActivity === void 0 ? void 0 : userWithActivity.forumComments) {
                                for (_j = 0, _k = userWithActivity.forumComments; _j < _k.length; _j++) {
                                    comment = _k[_j];
                                    activity.push({
                                        type: 'forum_comment',
                                        title: "Commented on Forum",
                                        description: (comment.content || '').substring(0, 100) + '...',
                                        timestamp: this.safeISO(comment.createdAt),
                                        link: "/community/forum/".concat(comment.postId),
                                    });
                                }
                            }
                            activity.sort(function (a, b) { return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); });
                            sanitizedUser = userWithActivity ? __assign({}, userWithActivity) : null;
                            if (sanitizedUser) {
                                delete sanitizedUser.password;
                                delete sanitizedUser.refreshToken;
                            }
                            return [2 /*return*/, {
                                    applications: applications,
                                    documents: documents,
                                    activity: activity.slice(0, 15),
                                    applicationCount: applications.length,
                                    user: sanitizedUser,
                                }];
                        case 4:
                            error_1 = _l.sent();
                            console.error('Error in getUserDashboardData:', error_1);
                            throw error_1;
                        case 5: return [2 /*return*/];
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

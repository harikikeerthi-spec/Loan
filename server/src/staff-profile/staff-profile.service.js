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
exports.StaffProfileService = void 0;
var common_1 = require("@nestjs/common");
var StaffProfileService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var StaffProfileService = _classThis = /** @class */ (function () {
        function StaffProfileService_1(supabase, usersService, auditLog) {
            this.supabase = supabase;
            this.usersService = usersService;
            this.auditLog = auditLog;
        }
        Object.defineProperty(StaffProfileService_1.prototype, "db", {
            get: function () {
                return this.supabase.getClient();
            },
            enumerable: false,
            configurable: true
        });
        // ─── Create a staff-portal profile linked to a website user ───────────────
        StaffProfileService_1.prototype.createProfile = function (staffUser, body) {
            return __awaiter(this, void 0, void 0, function () {
                var linkedUser, existing, _a, profile, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.usersService.findById(body.linked_user_id)];
                        case 1:
                            linkedUser = _b.sent();
                            if (!linkedUser)
                                throw new common_1.NotFoundException('User account not found');
                            return [4 /*yield*/, this.db
                                    .from('StaffProfile')
                                    .select('id')
                                    .eq('linkedUserId', body.linked_user_id)
                                    .single()];
                        case 2:
                            existing = (_b.sent()).data;
                            if (existing)
                                throw new common_1.ConflictException('A profile already exists for this user');
                            return [4 /*yield*/, this.db
                                    .from('StaffProfile')
                                    .insert({
                                    linkedUserId: body.linked_user_id,
                                    assignedStaffId: staffUser.id,
                                    targetBank: body.target_bank || null,
                                    loanType: body.loan_type || null,
                                    internalNotes: body.internal_notes || null,
                                    bankStatus: 'NOT_SENT',
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                })
                                    .select()
                                    .single()];
                        case 3:
                            _a = _b.sent(), profile = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [4 /*yield*/, this.auditLog.logAction('PROFILE_CREATED', 'staff_profile', profile.id, staffUser, {
                                    linked_user_id: body.linked_user_id,
                                })];
                        case 4:
                            _b.sent();
                            return [2 /*return*/, profile];
                    }
                });
            });
        };
        // ─── List all staff profiles (with linked user info) ───────────────────────
        StaffProfileService_1.prototype.listProfiles = function (staffUser, query) {
            return __awaiter(this, void 0, void 0, function () {
                var q, _a, data, error, results, s_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            q = this.db
                                .from('StaffProfile')
                                .select("*, linkedUser:User!linkedUserId(id, firstName, lastName, email, mobile, role, createdAt)")
                                .order('createdAt', { ascending: false });
                            if (query.bankStatus && query.bankStatus !== 'all') {
                                q = q.eq('bankStatus', query.bankStatus);
                            }
                            return [4 /*yield*/, q];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            results = data || [];
                            if (query.search) {
                                s_1 = query.search.toLowerCase();
                                results = results.filter(function (p) {
                                    var _a, _b, _c, _d, _e, _f, _g;
                                    return ((_b = (_a = p.linkedUser) === null || _a === void 0 ? void 0 : _a.firstName) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(s_1)) ||
                                        ((_d = (_c = p.linkedUser) === null || _c === void 0 ? void 0 : _c.lastName) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(s_1)) ||
                                        ((_f = (_e = p.linkedUser) === null || _e === void 0 ? void 0 : _e.email) === null || _f === void 0 ? void 0 : _f.toLowerCase().includes(s_1)) ||
                                        ((_g = p.loanType) === null || _g === void 0 ? void 0 : _g.toLowerCase().includes(s_1));
                                });
                            }
                            return [2 /*return*/, results];
                    }
                });
            });
        };
        // ─── Get a single profile with its documents ───────────────────────────────
        StaffProfileService_1.prototype.getProfile = function (profileId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('StaffProfile')
                                .select("*, linkedUser:User!linkedUserId(id, firstName, lastName, email, mobile),\n         documents:StaffProfileDocument(*)")
                                .eq('id', profileId)
                                .single()];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error || !data)
                                throw new common_1.NotFoundException('Profile not found');
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        // ─── Fetch & attach documents from the linked user account ─────────────────
        StaffProfileService_1.prototype.fetchUserDocuments = function (profileId, staffUser) {
            return __awaiter(this, void 0, void 0, function () {
                var profile, userDocs, alreadyAttached, attachedIds, toAttach, skipped, inserted, rows, _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getProfile(profileId)];
                        case 1:
                            profile = _b.sent();
                            return [4 /*yield*/, this.usersService.getUserDocuments(profile.linkedUserId)];
                        case 2:
                            userDocs = _b.sent();
                            if (!userDocs.length)
                                return [2 /*return*/, { fetched: 0, documents: [], skipped: 0 }];
                            return [4 /*yield*/, this.db
                                    .from('StaffProfileDocument')
                                    .select('userDocumentId')
                                    .eq('staffProfileId', profileId)];
                        case 3:
                            alreadyAttached = (_b.sent()).data;
                            attachedIds = new Set((alreadyAttached || []).map(function (d) { return d.userDocumentId; }));
                            toAttach = userDocs.filter(function (d) { return !attachedIds.has(d.id); });
                            skipped = userDocs.length - toAttach.length;
                            inserted = [];
                            if (!toAttach.length) return [3 /*break*/, 5];
                            rows = toAttach.map(function (doc) {
                                var _a;
                                return ({
                                    staffProfileId: profileId,
                                    userDocumentId: doc.id,
                                    docType: doc.docType,
                                    filePath: doc.filePath,
                                    originalFilename: ((_a = doc.filePath) === null || _a === void 0 ? void 0 : _a.split('/').pop()) || doc.docType,
                                    source: 'USER_UPLOAD',
                                    status: doc.status || 'pending',
                                    uploadedBy: doc.userId,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                });
                            });
                            return [4 /*yield*/, this.db
                                    .from('StaffProfileDocument')
                                    .insert(rows)
                                    .select()];
                        case 4:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            inserted = data || [];
                            _b.label = 5;
                        case 5: return [4 /*yield*/, this.auditLog.logAction('DOCUMENT_FETCHED', 'staff_profile', profileId, staffUser, {
                                fetched: inserted.length,
                                skipped: skipped,
                            })];
                        case 6:
                            _b.sent();
                            return [2 /*return*/, { fetched: inserted.length, documents: inserted, skipped: skipped }];
                    }
                });
            });
        };
        // ─── Upload a document directly as staff ───────────────────────────────────
        StaffProfileService_1.prototype.uploadStaffDocument = function (profileId, staffUser, file, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!file)
                                throw new common_1.BadRequestException('File is required');
                            // Verify profile exists
                            return [4 /*yield*/, this.getProfile(profileId)];
                        case 1:
                            // Verify profile exists
                            _b.sent();
                            return [4 /*yield*/, this.db
                                    .from('StaffProfileDocument')
                                    .insert({
                                    staffProfileId: profileId,
                                    userDocumentId: null,
                                    docType: body.doc_type,
                                    filePath: file.path,
                                    originalFilename: file.originalname,
                                    source: 'STAFF_UPLOAD',
                                    status: 'pending',
                                    description: body.description || null,
                                    uploadedBy: staffUser.id,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                })
                                    .select()
                                    .single()];
                        case 2:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [4 /*yield*/, this.auditLog.logAction('DOCUMENT_UPLOADED', 'staff_profile', profileId, staffUser, {
                                    docId: data.id,
                                    docType: body.doc_type,
                                    source: 'STAFF_UPLOAD',
                                })];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        // ─── Update document status & propagate back to UserDocument ───────────────
        StaffProfileService_1.prototype.updateDocumentStatus = function (profileId, docId, staffUser, body) {
            return __awaiter(this, void 0, void 0, function () {
                var validStatuses, _a, doc, fetchErr, oldStatus, _b, updated, updErr, syncResult, syncErr;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'requires_resubmission'];
                            if (!validStatuses.includes(body.status)) {
                                throw new common_1.BadRequestException("Invalid status. Allowed: ".concat(validStatuses.join(', ')));
                            }
                            return [4 /*yield*/, this.db
                                    .from('StaffProfileDocument')
                                    .select('*')
                                    .eq('id', docId)
                                    .eq('staffProfileId', profileId)
                                    .single()];
                        case 1:
                            _a = _c.sent(), doc = _a.data, fetchErr = _a.error;
                            if (fetchErr || !doc)
                                throw new common_1.NotFoundException('Document not found in this profile');
                            oldStatus = doc.status;
                            return [4 /*yield*/, this.db
                                    .from('StaffProfileDocument')
                                    .update({
                                    status: body.status,
                                    rejectionReason: body.rejection_reason || null,
                                    updatedAt: new Date().toISOString(),
                                })
                                    .eq('id', docId)
                                    .select()
                                    .single()];
                        case 2:
                            _b = _c.sent(), updated = _b.data, updErr = _b.error;
                            if (updErr)
                                throw updErr;
                            syncResult = 'no_user_doc';
                            if (!doc.userDocumentId) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.db
                                    .from('UserDocument')
                                    .update({ status: body.status, updatedAt: new Date().toISOString() })
                                    .eq('id', doc.userDocumentId)];
                        case 3:
                            syncErr = (_c.sent()).error;
                            syncResult = syncErr ? 'sync_failed' : 'synced';
                            _c.label = 4;
                        case 4: return [4 /*yield*/, this.auditLog.logAction('STATUS_UPDATED', 'staff_profile_document', docId, staffUser, {
                                old_status: oldStatus,
                                new_status: body.status,
                                rejection_reason: body.rejection_reason,
                                sync: syncResult,
                            })];
                        case 5:
                            _c.sent();
                            return [2 /*return*/, { document: updated, sync: syncResult }];
                    }
                });
            });
        };
        // ─── Share a document bundle with the bank ─────────────────────────────────
        StaffProfileService_1.prototype.shareWithBank = function (profileId, staffUser, body) {
            return __awaiter(this, void 0, void 0, function () {
                var expiresAt, token, _a, share, error, baseUrl;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!((_b = body.doc_ids) === null || _b === void 0 ? void 0 : _b.length))
                                throw new common_1.BadRequestException('Select at least one document');
                            if (!body.bank_email)
                                throw new common_1.BadRequestException('Bank email is required');
                            return [4 /*yield*/, this.getProfile(profileId)];
                        case 1:
                            _c.sent();
                            expiresAt = new Date();
                            expiresAt.setDate(expiresAt.getDate() + (body.expires_in_days || 7));
                            token = Buffer.from(JSON.stringify({ profileId: profileId, ts: Date.now(), r: Math.random() })).toString('base64url');
                            return [4 /*yield*/, this.db
                                    .from('StaffProfileShare')
                                    .insert({
                                    staffProfileId: profileId,
                                    sharedBy: staffUser.id,
                                    bankName: body.bank_name,
                                    bankEmail: body.bank_email,
                                    documentIds: body.doc_ids,
                                    token: token,
                                    expiresAt: expiresAt.toISOString(),
                                    accessNote: body.access_note || null,
                                    accessCount: 0,
                                    revoked: false,
                                    createdAt: new Date().toISOString(),
                                })
                                    .select()
                                    .single()];
                        case 2:
                            _a = _c.sent(), share = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            // Update profile bank status
                            return [4 /*yield*/, this.db
                                    .from('StaffProfile')
                                    .update({ bankStatus: 'PENDING', updatedAt: new Date().toISOString() })
                                    .eq('id', profileId)];
                        case 3:
                            // Update profile bank status
                            _c.sent();
                            return [4 /*yield*/, this.auditLog.logAction('SHARE_CREATED', 'staff_profile_share', share.id, staffUser, {
                                    bank_name: body.bank_name,
                                    bank_email: body.bank_email,
                                    document_count: body.doc_ids.length,
                                    expires_at: expiresAt.toISOString(),
                                })];
                        case 4:
                            _c.sent();
                            baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                            return [2 /*return*/, {
                                    share_id: share.id,
                                    token: token,
                                    share_url: "".concat(baseUrl, "/share/").concat(token),
                                    expires_at: expiresAt.toISOString(),
                                    documents_shared: body.doc_ids.length,
                                }];
                    }
                });
            });
        };
        // ─── Get documents attached to a profile ───────────────────────────────────
        StaffProfileService_1.prototype.getProfileDocuments = function (profileId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('StaffProfileDocument')
                                .select('*')
                                .eq('staffProfileId', profileId)
                                .order('createdAt', { ascending: false })];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data || []];
                    }
                });
            });
        };
        // ─── Get share history for a profile ───────────────────────────────────────
        StaffProfileService_1.prototype.getShareHistory = function (profileId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('StaffProfileShare')
                                .select('*')
                                .eq('staffProfileId', profileId)
                                .order('createdAt', { ascending: false })];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, data || []];
                    }
                });
            });
        };
        // ─── Delete (detach) a document from a profile ─────────────────────────────
        StaffProfileService_1.prototype.removeDocument = function (profileId, docId, staffUser) {
            return __awaiter(this, void 0, void 0, function () {
                var error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('StaffProfileDocument')
                                .delete()
                                .eq('id', docId)
                                .eq('staffProfileId', profileId)];
                        case 1:
                            error = (_a.sent()).error;
                            if (error)
                                throw error;
                            return [4 /*yield*/, this.auditLog.logAction('DOCUMENT_REMOVED', 'staff_profile_document', docId, staffUser, {
                                    profileId: profileId,
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        return StaffProfileService_1;
    }());
    __setFunctionName(_classThis, "StaffProfileService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StaffProfileService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StaffProfileService = _classThis;
}();
exports.StaffProfileService = StaffProfileService;

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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiPartyChatService = void 0;
var common_1 = require("@nestjs/common");
var MultiPartyChatService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MultiPartyChatService = _classThis = /** @class */ (function () {
        function MultiPartyChatService_1(supabase, emailService) {
            this.supabase = supabase;
            this.emailService = emailService;
            this.logger = new common_1.Logger(MultiPartyChatService.name);
        }
        Object.defineProperty(MultiPartyChatService_1.prototype, "db", {
            get: function () {
                return this.supabase.getClient();
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Create or get multi-party conversation linked to an application
         */
        MultiPartyChatService_1.prototype.getOrCreateMultiPartyConversation = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, _a, conversation, convError, participants, _i, participants_1, participant, error_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 7, , 8]);
                            return [4 /*yield*/, this.db
                                    .from('Conversation')
                                    .select('id')
                                    .eq('applicationId', data.applicationId)
                                    .eq('isMultiParty', true)
                                    .maybeSingle()];
                        case 1:
                            existing = (_b.sent()).data;
                            if (existing) {
                                return [2 /*return*/, existing];
                            }
                            return [4 /*yield*/, this.db
                                    .from('Conversation')
                                    .insert({
                                    applicationId: data.applicationId,
                                    isMultiParty: true,
                                    conversationTopic: data.topic,
                                    metadata: { type: 'multiparty' },
                                    status: 'active',
                                })
                                    .select()
                                    .single()];
                        case 2:
                            _a = _b.sent(), conversation = _a.data, convError = _a.error;
                            if (convError)
                                throw convError;
                            participants = __spreadArray(__spreadArray(__spreadArray([], data.customers.map(function (c) { return (__assign(__assign({}, c), { role: 'customer' })); }), true), (data.staffMembers || []).map(function (s) { return (__assign(__assign({}, s), { role: 'staff' })); }), true), (data.bankMembers || []).map(function (b) { return (__assign(__assign({}, b), { role: 'bank' })); }), true);
                            _i = 0, participants_1 = participants;
                            _b.label = 3;
                        case 3:
                            if (!(_i < participants_1.length)) return [3 /*break*/, 6];
                            participant = participants_1[_i];
                            return [4 /*yield*/, this.db
                                    .from('Conversation_Participant')
                                    .insert({
                                    conversationId: conversation.id,
                                    email: participant.email,
                                    fullName: participant.fullName,
                                    role: participant.role,
                                    canShare: true,
                                })
                                    .single()];
                        case 4:
                            _b.sent();
                            _b.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6: return [2 /*return*/, conversation];
                        case 7:
                            error_1 = _b.sent();
                            this.logger.error('Failed to create multi-party conversation', error_1);
                            throw error_1;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Save message in multi-party conversation
         */
        MultiPartyChatService_1.prototype.saveMultiPartyMessage = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var conversation, recipients, participants, _a, message, msgError, _i, recipients_1, email, participant, error_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 11, , 12]);
                            return [4 /*yield*/, this.db
                                    .from('Conversation')
                                    .select('*')
                                    .eq('id', data.conversationId)
                                    .single()];
                        case 1:
                            conversation = (_b.sent()).data;
                            recipients = data.recipientEmails;
                            if (!(!recipients || recipients.length === 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.db
                                    .from('Conversation_Participant')
                                    .select('email, role')
                                    .eq('conversationId', data.conversationId)];
                        case 2:
                            participants = (_b.sent()).data;
                            recipients = (participants === null || participants === void 0 ? void 0 : participants.map(function (p) { return p.email; })) || [];
                            _b.label = 3;
                        case 3: return [4 /*yield*/, this.db
                                .from('Message')
                                .insert({
                                conversationId: data.conversationId,
                                senderType: data.senderRole,
                                senderId: data.senderEmail,
                                content: data.content,
                                messageType: data.messageType || 'text',
                                status: 'sent',
                                recipientEmails: recipients,
                            })
                                .select()
                                .single()];
                        case 4:
                            _a = _b.sent(), message = _a.data, msgError = _a.error;
                            if (msgError)
                                throw msgError;
                            _i = 0, recipients_1 = recipients;
                            _b.label = 5;
                        case 5:
                            if (!(_i < recipients_1.length)) return [3 /*break*/, 9];
                            email = recipients_1[_i];
                            return [4 /*yield*/, this.db
                                    .from('Conversation_Participant')
                                    .select('role')
                                    .eq('conversationId', data.conversationId)
                                    .eq('email', email)
                                    .single()];
                        case 6:
                            participant = (_b.sent()).data;
                            return [4 /*yield*/, this.db
                                    .from('Message_Recipient')
                                    .insert({
                                    messageId: message.id,
                                    recipientEmail: email,
                                    recipientRole: (participant === null || participant === void 0 ? void 0 : participant.role) || 'unknown',
                                    status: 'delivered',
                                })];
                        case 7:
                            _b.sent();
                            _b.label = 8;
                        case 8:
                            _i++;
                            return [3 /*break*/, 5];
                        case 9: 
                        // Update conversation timestamp
                        return [4 /*yield*/, this.db
                                .from('Conversation')
                                .update({ updatedAt: new Date().toISOString() })
                                .eq('id', data.conversationId)];
                        case 10:
                            // Update conversation timestamp
                            _b.sent();
                            return [2 /*return*/, message];
                        case 11:
                            error_2 = _b.sent();
                            this.logger.error('Failed to save multi-party message', error_2);
                            throw error_2;
                        case 12: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Share document across all conversation participants
         */
        MultiPartyChatService_1.prototype.shareDocument = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var participants, sharedEmails, sharedRoles, _a, docShare, shareError, uploader, _i, _b, participant, emailSent, error_3;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 9, , 10]);
                            return [4 /*yield*/, this.db
                                    .from('Conversation_Participant')
                                    .select('email, role, fullName')
                                    .eq('conversationId', data.conversationId)];
                        case 1:
                            participants = (_c.sent()).data;
                            sharedEmails = (participants === null || participants === void 0 ? void 0 : participants.map(function (p) { return p.email; })) || [];
                            sharedRoles = __spreadArray([], new Set((participants === null || participants === void 0 ? void 0 : participants.map(function (p) { return p.role; })) || []), true);
                            return [4 /*yield*/, this.db
                                    .from('Document_Share')
                                    .insert({
                                    conversationId: data.conversationId,
                                    applicationId: data.applicationId,
                                    documentId: data.documentId,
                                    documentName: data.documentName,
                                    documentType: data.documentType,
                                    uploadedBy: data.uploadedByEmail,
                                    uploaderRole: data.uploaderRole,
                                    sharedWith: sharedEmails,
                                    sharedWithRoles: sharedRoles,
                                    status: 'active',
                                })
                                    .select()
                                    .single()];
                        case 2:
                            _a = _c.sent(), docShare = _a.data, shareError = _a.error;
                            if (shareError)
                                throw shareError;
                            // Create system message about document share
                            return [4 /*yield*/, this.saveMultiPartyMessage({
                                    conversationId: data.conversationId,
                                    senderEmail: 'system@vidhyaloan.com',
                                    senderName: 'VidhyaLoan System',
                                    senderRole: 'system',
                                    content: "\uD83D\uDCC4 Document shared: ".concat(data.documentName),
                                    messageType: 'document_share',
                                    recipientEmails: sharedEmails,
                                })];
                        case 3:
                            // Create system message about document share
                            _c.sent();
                            uploader = participants === null || participants === void 0 ? void 0 : participants.find(function (p) { return p.email === data.uploadedByEmail; });
                            _i = 0, _b = participants || [];
                            _c.label = 4;
                        case 4:
                            if (!(_i < _b.length)) return [3 /*break*/, 8];
                            participant = _b[_i];
                            if (!(participant.email !== data.uploadedByEmail)) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.emailService.sendDocumentNotificationEmail(participant.email, {
                                    documentName: data.documentName,
                                    uploadedBy: (uploader === null || uploader === void 0 ? void 0 : uploader.fullName) || data.uploadedByEmail,
                                    uploadedByRole: data.uploaderRole,
                                    applicationNumber: data.applicationId,
                                    status: 'Shared',
                                })];
                        case 5:
                            emailSent = _c.sent();
                            // Log email
                            return [4 /*yield*/, this.db.from('Email_Log').insert({
                                    recipientEmail: participant.email,
                                    subject: "Document Shared: ".concat(data.documentName),
                                    documentShareId: docShare.id,
                                    status: emailSent ? 'sent' : 'failed',
                                })];
                        case 6:
                            // Log email
                            _c.sent();
                            _c.label = 7;
                        case 7:
                            _i++;
                            return [3 /*break*/, 4];
                        case 8: return [2 /*return*/, docShare];
                        case 9:
                            error_3 = _c.sent();
                            this.logger.error('Failed to share document', error_3);
                            throw error_3;
                        case 10: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Add participant to conversation
         */
        MultiPartyChatService_1.prototype.addParticipant = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, participant, error, error_4;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.db
                                    .from('Conversation_Participant')
                                    .insert({
                                    conversationId: data.conversationId,
                                    email: data.email,
                                    fullName: data.fullName,
                                    role: data.role,
                                    canShare: true,
                                })
                                    .select()
                                    .single()];
                        case 1:
                            _a = _b.sent(), participant = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            // Create system message
                            return [4 /*yield*/, this.saveMultiPartyMessage({
                                    conversationId: data.conversationId,
                                    senderEmail: 'system@vidhyaloan.com',
                                    senderName: 'VidhyaLoan System',
                                    senderRole: 'system',
                                    content: "\u2705 ".concat(data.fullName, " (").concat(data.role, ") joined the conversation"),
                                    messageType: 'participant_joined',
                                })];
                        case 2:
                            // Create system message
                            _b.sent();
                            return [2 /*return*/, participant];
                        case 3:
                            error_4 = _b.sent();
                            this.logger.error('Failed to add participant', error_4);
                            throw error_4;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get all messages for a conversation with participants info
         */
        MultiPartyChatService_1.prototype.getConversationMessages = function (conversationId, userEmail) {
            return __awaiter(this, void 0, void 0, function () {
                var messages, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.db
                                    .from('Message')
                                    .select("\n          *,\n          Message_Recipient (\n            recipientEmail,\n            recipientRole,\n            status,\n            readAt\n          )\n        ")
                                    .eq('conversationId', conversationId)
                                    .order('createdAt', { ascending: true })];
                        case 1:
                            messages = (_a.sent()).data;
                            return [2 /*return*/, messages || []];
                        case 2:
                            error_5 = _a.sent();
                            this.logger.error('Failed to get conversation messages', error_5);
                            throw error_5;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get all shared documents in conversation
         */
        MultiPartyChatService_1.prototype.getConversationDocuments = function (conversationId) {
            return __awaiter(this, void 0, void 0, function () {
                var documents, error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.db
                                    .from('Document_Share')
                                    .select('*')
                                    .eq('conversationId', conversationId)
                                    .order('createdAt', { ascending: false })];
                        case 1:
                            documents = (_a.sent()).data;
                            return [2 /*return*/, documents || []];
                        case 2:
                            error_6 = _a.sent();
                            this.logger.error('Failed to get conversation documents', error_6);
                            throw error_6;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get conversations for a user email with participant details
         */
        MultiPartyChatService_1.prototype.getUserConversations = function (userEmail) {
            return __awaiter(this, void 0, void 0, function () {
                var participations, error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.db
                                    .from('Conversation_Participant')
                                    .select("\n          conversationId,\n          Conversation (\n            id,\n            applicationId,\n            conversationTopic,\n            isMultiParty,\n            status,\n            updatedAt,\n            metadata\n          )\n        ")
                                    .eq('email', userEmail)
                                    .eq('isActive', true)];
                        case 1:
                            participations = (_a.sent()).data;
                            return [2 /*return*/, (participations === null || participations === void 0 ? void 0 : participations.map(function (p) { return p.Conversation; })) || []];
                        case 2:
                            error_7 = _a.sent();
                            this.logger.error('Failed to get user conversations', error_7);
                            throw error_7;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get conversation participants
         */
        MultiPartyChatService_1.prototype.getConversationParticipants = function (conversationId) {
            return __awaiter(this, void 0, void 0, function () {
                var participants, error_8;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.db
                                    .from('Conversation_Participant')
                                    .select('*')
                                    .eq('conversationId', conversationId)
                                    .eq('isActive', true)
                                    .order('joinedAt', { ascending: false })];
                        case 1:
                            participants = (_a.sent()).data;
                            return [2 /*return*/, participants || []];
                        case 2:
                            error_8 = _a.sent();
                            this.logger.error('Failed to get conversation participants', error_8);
                            throw error_8;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Send email notification for chat message
         */
        MultiPartyChatService_1.prototype.notifyParticipantOfMessage = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var emailSent, error_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, this.emailService.sendChatNotificationEmail(data.recipientEmail, data.senderName, data.senderRole, data.messageContent, {
                                    applicationNumber: data.applicationNumber,
                                    subject: data.conversationTopic,
                                    bank: data.bank,
                                })];
                        case 1:
                            emailSent = _a.sent();
                            if (!emailSent) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.db.from('Email_Log').insert({
                                    recipientEmail: data.recipientEmail,
                                    subject: "New Message: ".concat(data.conversationTopic),
                                    status: 'sent',
                                })];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/, emailSent];
                        case 4:
                            error_9 = _a.sent();
                            this.logger.error('Failed to send notification email', error_9);
                            return [2 /*return*/, false];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        return MultiPartyChatService_1;
    }());
    __setFunctionName(_classThis, "MultiPartyChatService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MultiPartyChatService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MultiPartyChatService = _classThis;
}();
exports.MultiPartyChatService = MultiPartyChatService;

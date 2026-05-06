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
exports.MultiPartyChatController = void 0;
var common_1 = require("@nestjs/common");
var user_guard_1 = require("../auth/user.guard");
var MultiPartyChatController = function () {
    var _classDecorators = [(0, common_1.Controller)('chat'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _createMultiPartyConversation_decorators;
    var _getMyConversations_decorators;
    var _getConversationDetails_decorators;
    var _getConversationMessages_decorators;
    var _sendMessage_decorators;
    var _shareDocument_decorators;
    var _getSharedDocuments_decorators;
    var _addParticipant_decorators;
    var _getParticipants_decorators;
    var _notifyByEmail_decorators;
    var MultiPartyChatController = _classThis = /** @class */ (function () {
        function MultiPartyChatController_1(multiPartyChatService) {
            this.multiPartyChatService = (__runInitializers(this, _instanceExtraInitializers), multiPartyChatService);
            this.logger = new common_1.Logger(MultiPartyChatController.name);
        }
        /**
         * Create multi-party conversation linked to an application
         */
        MultiPartyChatController_1.prototype.createMultiPartyConversation = function (req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var conversation, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.multiPartyChatService.getOrCreateMultiPartyConversation(body)];
                        case 1:
                            conversation = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: conversation,
                                    message: 'Multi-party conversation created successfully',
                                }];
                        case 2:
                            error_1 = _a.sent();
                            this.logger.error('Failed to create multi-party conversation', error_1);
                            throw new common_1.HttpException('Failed to create conversation', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get user's conversations
         */
        MultiPartyChatController_1.prototype.getMyConversations = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                var conversations, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.multiPartyChatService.getUserConversations(req.user.email)];
                        case 1:
                            conversations = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: conversations,
                                }];
                        case 2:
                            error_2 = _a.sent();
                            throw new common_1.HttpException('Failed to fetch conversations', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get conversation details with participants and documents
         */
        MultiPartyChatController_1.prototype.getConversationDetails = function (conversationId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, messages, documents, participants, error_3;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, Promise.all([
                                    this.multiPartyChatService.getConversationMessages(conversationId),
                                    this.multiPartyChatService.getConversationDocuments(conversationId),
                                    this.multiPartyChatService.getConversationParticipants(conversationId),
                                ])];
                        case 1:
                            _a = _b.sent(), messages = _a[0], documents = _a[1], participants = _a[2];
                            return [2 /*return*/, {
                                    success: true,
                                    data: {
                                        messages: messages,
                                        documents: documents,
                                        participants: participants,
                                    },
                                }];
                        case 2:
                            error_3 = _b.sent();
                            throw new common_1.HttpException('Failed to fetch conversation details', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get conversation messages
         */
        MultiPartyChatController_1.prototype.getConversationMessages = function (conversationId, req) {
            return __awaiter(this, void 0, void 0, function () {
                var messages, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.multiPartyChatService.getConversationMessages(conversationId, req.user.email)];
                        case 1:
                            messages = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: messages,
                                }];
                        case 2:
                            error_4 = _a.sent();
                            throw new common_1.HttpException('Failed to fetch messages', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Send message in multi-party conversation
         */
        MultiPartyChatController_1.prototype.sendMessage = function (conversationId, req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var message, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.multiPartyChatService.saveMultiPartyMessage({
                                    conversationId: conversationId,
                                    senderEmail: req.user.email,
                                    senderName: "".concat(req.user.firstName || '', " ").concat(req.user.lastName || '').trim(),
                                    senderRole: req.user.role,
                                    content: body.content,
                                    messageType: 'text',
                                    recipientEmails: body.recipientEmails,
                                })];
                        case 1:
                            message = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: message,
                                    message: 'Message sent successfully',
                                }];
                        case 2:
                            error_5 = _a.sent();
                            this.logger.error('Failed to send message', error_5);
                            throw new common_1.HttpException('Failed to send message', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Share document in conversation
         */
        MultiPartyChatController_1.prototype.shareDocument = function (conversationId, req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var docShare, error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.multiPartyChatService.shareDocument({
                                    conversationId: conversationId,
                                    applicationId: body.applicationId,
                                    documentId: body.documentId,
                                    documentName: body.documentName,
                                    documentType: body.documentType,
                                    uploadedByEmail: req.user.email,
                                    uploaderRole: req.user.role,
                                })];
                        case 1:
                            docShare = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: docShare,
                                    message: 'Document shared successfully',
                                }];
                        case 2:
                            error_6 = _a.sent();
                            this.logger.error('Failed to share document', error_6);
                            throw new common_1.HttpException('Failed to share document', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get shared documents
         */
        MultiPartyChatController_1.prototype.getSharedDocuments = function (conversationId) {
            return __awaiter(this, void 0, void 0, function () {
                var documents, error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.multiPartyChatService.getConversationDocuments(conversationId)];
                        case 1:
                            documents = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: documents,
                                }];
                        case 2:
                            error_7 = _a.sent();
                            throw new common_1.HttpException('Failed to fetch documents', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Add participant to conversation
         */
        MultiPartyChatController_1.prototype.addParticipant = function (conversationId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var participant, error_8;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.multiPartyChatService.addParticipant({
                                    conversationId: conversationId,
                                    email: body.email,
                                    fullName: body.fullName,
                                    role: body.role,
                                })];
                        case 1:
                            participant = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: participant,
                                    message: 'Participant added successfully',
                                }];
                        case 2:
                            error_8 = _a.sent();
                            this.logger.error('Failed to add participant', error_8);
                            throw new common_1.HttpException('Failed to add participant', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get conversation participants
         */
        MultiPartyChatController_1.prototype.getParticipants = function (conversationId) {
            return __awaiter(this, void 0, void 0, function () {
                var participants, error_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.multiPartyChatService.getConversationParticipants(conversationId)];
                        case 1:
                            participants = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: participants,
                                }];
                        case 2:
                            error_9 = _a.sent();
                            throw new common_1.HttpException('Failed to fetch participants', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Send email notification for message (Admin/Staff)
         */
        MultiPartyChatController_1.prototype.notifyByEmail = function (conversationId, req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var emailSent, error_10;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            // Only staff and admin can send notification emails
                            if (!['staff', 'admin', 'super_admin', 'bank', 'partner_bank'].includes(req.user.role)) {
                                throw new common_1.HttpException('Unauthorized', common_1.HttpStatus.FORBIDDEN);
                            }
                            return [4 /*yield*/, this.multiPartyChatService.notifyParticipantOfMessage({
                                    recipientEmail: body.recipientEmail,
                                    senderName: "".concat(req.user.firstName || '', " ").concat(req.user.lastName || '').trim(),
                                    senderRole: req.user.role,
                                    messageContent: body.messageContent,
                                    conversationTopic: body.conversationTopic,
                                    applicationNumber: body.applicationNumber,
                                    bank: body.bank,
                                })];
                        case 1:
                            emailSent = _a.sent();
                            return [2 /*return*/, {
                                    success: emailSent,
                                    message: emailSent ? 'Email sent successfully' : 'Failed to send email',
                                }];
                        case 2:
                            error_10 = _a.sent();
                            this.logger.error('Failed to send notification email', error_10);
                            throw new common_1.HttpException('Failed to send email', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return MultiPartyChatController_1;
    }());
    __setFunctionName(_classThis, "MultiPartyChatController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createMultiPartyConversation_decorators = [(0, common_1.Post)('multiparty/create')];
        _getMyConversations_decorators = [(0, common_1.Get)('conversations/my')];
        _getConversationDetails_decorators = [(0, common_1.Get)('multiparty/:conversationId/details')];
        _getConversationMessages_decorators = [(0, common_1.Get)('multiparty/:conversationId/messages')];
        _sendMessage_decorators = [(0, common_1.Post)('multiparty/:conversationId/message')];
        _shareDocument_decorators = [(0, common_1.Post)('multiparty/:conversationId/share-document')];
        _getSharedDocuments_decorators = [(0, common_1.Get)('multiparty/:conversationId/documents')];
        _addParticipant_decorators = [(0, common_1.Post)('multiparty/:conversationId/participant')];
        _getParticipants_decorators = [(0, common_1.Get)('multiparty/:conversationId/participants')];
        _notifyByEmail_decorators = [(0, common_1.Post)('multiparty/:conversationId/notify-email')];
        __esDecorate(_classThis, null, _createMultiPartyConversation_decorators, { kind: "method", name: "createMultiPartyConversation", static: false, private: false, access: { has: function (obj) { return "createMultiPartyConversation" in obj; }, get: function (obj) { return obj.createMultiPartyConversation; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyConversations_decorators, { kind: "method", name: "getMyConversations", static: false, private: false, access: { has: function (obj) { return "getMyConversations" in obj; }, get: function (obj) { return obj.getMyConversations; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConversationDetails_decorators, { kind: "method", name: "getConversationDetails", static: false, private: false, access: { has: function (obj) { return "getConversationDetails" in obj; }, get: function (obj) { return obj.getConversationDetails; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConversationMessages_decorators, { kind: "method", name: "getConversationMessages", static: false, private: false, access: { has: function (obj) { return "getConversationMessages" in obj; }, get: function (obj) { return obj.getConversationMessages; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _sendMessage_decorators, { kind: "method", name: "sendMessage", static: false, private: false, access: { has: function (obj) { return "sendMessage" in obj; }, get: function (obj) { return obj.sendMessage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _shareDocument_decorators, { kind: "method", name: "shareDocument", static: false, private: false, access: { has: function (obj) { return "shareDocument" in obj; }, get: function (obj) { return obj.shareDocument; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSharedDocuments_decorators, { kind: "method", name: "getSharedDocuments", static: false, private: false, access: { has: function (obj) { return "getSharedDocuments" in obj; }, get: function (obj) { return obj.getSharedDocuments; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addParticipant_decorators, { kind: "method", name: "addParticipant", static: false, private: false, access: { has: function (obj) { return "addParticipant" in obj; }, get: function (obj) { return obj.addParticipant; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getParticipants_decorators, { kind: "method", name: "getParticipants", static: false, private: false, access: { has: function (obj) { return "getParticipants" in obj; }, get: function (obj) { return obj.getParticipants; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _notifyByEmail_decorators, { kind: "method", name: "notifyByEmail", static: false, private: false, access: { has: function (obj) { return "notifyByEmail" in obj; }, get: function (obj) { return obj.notifyByEmail; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MultiPartyChatController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MultiPartyChatController = _classThis;
}();
exports.MultiPartyChatController = MultiPartyChatController;

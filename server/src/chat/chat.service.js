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
exports.ChatService = void 0;
var common_1 = require("@nestjs/common");
var ChatService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ChatService = _classThis = /** @class */ (function () {
        function ChatService_1(supabase) {
            this.supabase = supabase;
            this.logger = new common_1.Logger(ChatService.name);
        }
        Object.defineProperty(ChatService_1.prototype, "db", {
            get: function () {
                return this.supabase.getClient();
            },
            enumerable: false,
            configurable: true
        });
        ChatService_1.prototype.getOrCreateConversation = function (customerPhone_1, customerEmail_1) {
            return __awaiter(this, arguments, void 0, function (customerPhone, customerEmail, conversationType, customerName, bankName) {
                var phone, _a, conv, error, _b, newConv, createError;
                if (conversationType === void 0) { conversationType = 'staff'; }
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!customerPhone) {
                                throw new common_1.HttpException('A valid phone number is required to start a chat. Please update your profile.', common_1.HttpStatus.BAD_REQUEST);
                            }
                            phone = customerPhone.replace('whatsapp:', '');
                            return [4 /*yield*/, this.db
                                    .from('Conversation')
                                    .select('*')
                                    .eq('customerPhone', phone)
                                    .eq('status', 'active')
                                    .maybeSingle()];
                        case 1:
                            _a = _c.sent(), conv = _a.data, error = _a.error;
                            if (!!conv) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.db
                                    .from('Conversation')
                                    .insert({
                                    customerPhone: phone,
                                    status: 'active',
                                    customerEmail: customerEmail || null,
                                    customerName: customerName || null,
                                    metadata: { type: conversationType, bank: bankName }
                                })
                                    .select()
                                    .single()];
                        case 2:
                            _b = _c.sent(), newConv = _b.data, createError = _b.error;
                            if (createError) {
                                this.logger.error('Failed to create conversation', createError);
                                throw new common_1.HttpException('Database error', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                            conv = newConv;
                            _c.label = 3;
                        case 3: return [2 /*return*/, conv];
                    }
                });
            });
        };
        ChatService_1.prototype.saveMessage = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, message, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Message')
                                .insert(__assign(__assign({}, data), { messageType: data.messageType || 'text', status: data.status || 'sent' }))
                                .select()
                                .single()];
                        case 1:
                            _a = _b.sent(), message = _a.data, error = _a.error;
                            if (error) {
                                this.logger.error('Failed to save message', error);
                                throw new common_1.HttpException('Database error saving message', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                            // Update conversation timestamp
                            return [4 /*yield*/, this.db
                                    .from('Conversation')
                                    .update({ updatedAt: new Date().toISOString() })
                                    .eq('id', data.conversationId)];
                        case 2:
                            // Update conversation timestamp
                            _b.sent();
                            return [2 /*return*/, message];
                    }
                });
            });
        };
        ChatService_1.prototype.getConversations = function () {
            return __awaiter(this, arguments, void 0, function (status, user) {
                var query, bankName, _a, data, error;
                if (status === void 0) { status = 'active'; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            query = this.db
                                .from('Conversation')
                                .select("\n          id, customerPhone, customerEmail, customerName, metadata, status, updatedAt, createdAt,\n          Message (id, content, senderType, createdAt, status)\n      ")
                                .eq('status', status)
                                .order('updatedAt', { ascending: false });
                            // Role-based filtering
                            if (user && (user.role === 'bank' || user.role === 'partner_bank')) {
                                // Bank partners should only see conversations explicitly marked for banks
                                query = query.contains('metadata', { type: 'bank' });
                                bankName = user.bankName || (user.firstName && user.firstName.includes('Bank') ? user.firstName : null);
                                if (bankName) {
                                    query = query.contains('metadata', { bank: bankName });
                                }
                            }
                            else if (user && user.role === 'agent') {
                                // Agents see conversations marked for agents
                                query = query.contains('metadata', { type: 'agent' });
                            }
                            return [4 /*yield*/, query];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error) {
                                throw new common_1.HttpException('Db Error', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                            // Sort messages and format
                            return [2 /*return*/, data.map(function (conv) { return (__assign(__assign({}, conv), { lastMessage: conv.Message && conv.Message.length > 0
                                        ? conv.Message.sort(function (a, b) { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); })[0]
                                        : null })); })];
                    }
                });
            });
        };
        ChatService_1.prototype.getMessages = function (conversationId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.db
                                .from('Message')
                                .select('*')
                                .eq('conversationId', conversationId)
                                .order('createdAt', { ascending: true })];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error) {
                                throw new common_1.HttpException('Db Error', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        ChatService_1.prototype.getMessagesByPhone = function (phone) {
            return __awaiter(this, void 0, void 0, function () {
                var cleanPhone, conv;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cleanPhone = phone.replace('whatsapp:', '');
                            return [4 /*yield*/, this.db
                                    .from('Conversation')
                                    .select('id')
                                    .eq('customerPhone', cleanPhone)
                                    .eq('status', 'active')
                                    .single()];
                        case 1:
                            conv = (_a.sent()).data;
                            if (!conv)
                                return [2 /*return*/, []];
                            return [2 /*return*/, this.getMessages(conv.id)];
                    }
                });
            });
        };
        return ChatService_1;
    }());
    __setFunctionName(_classThis, "ChatService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatService = _classThis;
}();
exports.ChatService = ChatService;

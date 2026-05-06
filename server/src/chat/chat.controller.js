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
exports.ChatController = void 0;
var common_1 = require("@nestjs/common");
var user_guard_1 = require("../auth/user.guard");
var ChatController = function () {
    var _classDecorators = [(0, common_1.Controller)('chat'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getConversations_decorators;
    var _getMessages_decorators;
    var _connectToStaff_decorators;
    var _startConversationWithCustomer_decorators;
    var ChatController = _classThis = /** @class */ (function () {
        function ChatController_1(chatService) {
            this.chatService = (__runInitializers(this, _instanceExtraInitializers), chatService);
        }
        ChatController_1.prototype.getConversations = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.chatService.getConversations('active', req.user)];
                });
            });
        };
        ChatController_1.prototype.getMessages = function (conversationId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.chatService.getMessages(conversationId)];
                });
            });
        };
        ChatController_1.prototype.connectToStaff = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                var user, fullName, conversation;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            user = req.user;
                            fullName = "".concat(user.firstName || '', " ").concat(user.lastName || '').trim();
                            return [4 /*yield*/, this.chatService.getOrCreateConversation(user.phoneNumber, user.email, 'staff', fullName || undefined)];
                        case 1:
                            conversation = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    conversation: conversation,
                                    whatsappUrl: "https://wa.me/".concat(process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886', "?text=Hi Vidhyaloan team, I am ").concat(user.firstName, " and I would like to connect with a mentor.")
                                }];
                    }
                });
            });
        };
        ChatController_1.prototype.startConversationWithCustomer = function (req, body) {
            return __awaiter(this, void 0, void 0, function () {
                var conversationType, bankName, conversation;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            conversationType = body.type || (req.user.role === 'bank' || req.user.role === 'partner_bank' ? 'bank' : 'staff');
                            bankName = body.bank || (req.user.role === 'bank' ? req.user.firstName : null);
                            return [4 /*yield*/, this.chatService.getOrCreateConversation(body.customerPhone, body.customerEmail, conversationType, body.customerName, bankName)];
                        case 1:
                            conversation = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    conversation: conversation
                                }];
                    }
                });
            });
        };
        return ChatController_1;
    }());
    __setFunctionName(_classThis, "ChatController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getConversations_decorators = [(0, common_1.Get)('conversations')];
        _getMessages_decorators = [(0, common_1.Get)('messages/:conversationId')];
        _connectToStaff_decorators = [(0, common_1.Post)('connect')];
        _startConversationWithCustomer_decorators = [(0, common_1.Post)('staff-start')];
        __esDecorate(_classThis, null, _getConversations_decorators, { kind: "method", name: "getConversations", static: false, private: false, access: { has: function (obj) { return "getConversations" in obj; }, get: function (obj) { return obj.getConversations; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMessages_decorators, { kind: "method", name: "getMessages", static: false, private: false, access: { has: function (obj) { return "getMessages" in obj; }, get: function (obj) { return obj.getMessages; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _connectToStaff_decorators, { kind: "method", name: "connectToStaff", static: false, private: false, access: { has: function (obj) { return "connectToStaff" in obj; }, get: function (obj) { return obj.connectToStaff; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _startConversationWithCustomer_decorators, { kind: "method", name: "startConversationWithCustomer", static: false, private: false, access: { has: function (obj) { return "startConversationWithCustomer" in obj; }, get: function (obj) { return obj.startConversationWithCustomer; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatController = _classThis;
}();
exports.ChatController = ChatController;

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
exports.ChatGateway = void 0;
var websockets_1 = require("@nestjs/websockets");
var common_1 = require("@nestjs/common");
var event_emitter_1 = require("@nestjs/event-emitter");
var ChatGateway = function () {
    var _classDecorators = [(0, websockets_1.WebSocketGateway)({
            cors: {
                origin: '*', // Change in production
            },
            namespace: '/chat'
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _server_decorators;
    var _server_initializers = [];
    var _server_extraInitializers = [];
    var _handleJoinConversation_decorators;
    var _handleLeaveConversation_decorators;
    var _handleSendMessage_decorators;
    var _handleSimReply_decorators;
    var _handleUserLogin_decorators;
    var ChatGateway = _classThis = /** @class */ (function () {
        function ChatGateway_1(chatService, twilioService, jwtService, configService) {
            this.chatService = (__runInitializers(this, _instanceExtraInitializers), chatService);
            this.twilioService = twilioService;
            this.jwtService = jwtService;
            this.configService = configService;
            this.server = __runInitializers(this, _server_initializers, void 0);
            this.logger = (__runInitializers(this, _server_extraInitializers), new common_1.Logger(ChatGateway.name));
        }
        ChatGateway_1.prototype.handleConnection = function (client) {
            return __awaiter(this, void 0, void 0, function () {
                var token, isSimulator, simPhone, cleanPhone, payload, error_1;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            token = client.handshake.auth.token || ((_a = client.handshake.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
                            isSimulator = client.handshake.auth.simulator === true;
                            simPhone = client.handshake.auth.phone;
                            if (isSimulator && simPhone) {
                                cleanPhone = String(simPhone).replace('whatsapp:', '');
                                client.join("sim_".concat(cleanPhone));
                                this.logger.log("Simulator connected for phone: ".concat(cleanPhone));
                                return [2 /*return*/];
                            }
                            if (!token) {
                                throw new Error('No token provided');
                            }
                            return [4 /*yield*/, this.jwtService.verifyAsync(token, {
                                    secret: this.configService.get('JWT_SECRET')
                                })];
                        case 1:
                            payload = _b.sent();
                            client.data.user = payload;
                            this.logger.log("Client connected: ".concat(client.id, " (User: ").concat(payload.email, ", Role: ").concat(payload.role, ")"));
                            // Join general room based on role
                            if (payload.role === 'admin' || payload.role === 'staff') {
                                client.join('room_staff');
                            }
                            else if (payload.role === 'bank') {
                                client.join('room_bank');
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _b.sent();
                            this.logger.warn("Connection rejected: ".concat(client.id, " - ").concat(error_1.message));
                            client.disconnect();
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        ChatGateway_1.prototype.handleDisconnect = function (client) {
            this.logger.log("Client disconnected: ".concat(client.id));
        };
        ChatGateway_1.prototype.handleJoinConversation = function (client, conversationId) {
            client.join("conv_".concat(conversationId));
            return { status: 'joined', conversationId: conversationId };
        };
        ChatGateway_1.prototype.handleLeaveConversation = function (client, conversationId) {
            client.leave("conv_".concat(conversationId));
            return { status: 'left', conversationId: conversationId };
        };
        ChatGateway_1.prototype.handleSendMessage = function (client, payload) {
            return __awaiter(this, void 0, void 0, function () {
                var user, senderType, msg, cleanPhone, e_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            user = client.data.user;
                            senderType = user.role || 'staff';
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 5, , 6]);
                            return [4 /*yield*/, this.chatService.saveMessage({
                                    conversationId: payload.conversationId,
                                    senderType: senderType,
                                    senderId: user.email || user.sub,
                                    receiverType: 'customer',
                                    content: payload.content,
                                    status: 'sent'
                                })];
                        case 2:
                            msg = _a.sent();
                            // 2. Broadcast to other dashboards observing this conversation
                            this.server.to("conv_".concat(payload.conversationId)).emit('new_message', msg);
                            // Also notify general dashboard rooms for list updates
                            if (user.role === 'bank' || user.role === 'partner_bank') {
                                this.server.to('room_bank').emit('conversation_updated', {
                                    conversationId: payload.conversationId,
                                    lastMessage: msg
                                });
                            }
                            else {
                                this.server.to('room_staff').emit('conversation_updated', {
                                    conversationId: payload.conversationId,
                                    lastMessage: msg
                                });
                            }
                            cleanPhone = payload.customerPhone.replace('whatsapp:', '');
                            this.server.to("sim_".concat(cleanPhone)).emit('wa_message_received', msg);
                            if (!payload.customerPhone) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.twilioService.sendWhatsAppMessage(payload.customerPhone, payload.content).catch(function (e) {
                                    _this.logger.error('Twilio Error (ignoring for simulation): ' + e.message);
                                })];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4: return [2 /*return*/, { success: true, message: msg }];
                        case 5:
                            e_1 = _a.sent();
                            this.logger.error('Failed to process outgoing message', e_1);
                            return [2 /*return*/, { success: false, error: e_1.message }];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        ChatGateway_1.prototype.handleSimReply = function (client, payload) {
            return __awaiter(this, void 0, void 0, function () {
                var from, conversation, msg, type, e_2;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            from = payload.phone.startsWith('whatsapp:') ? payload.phone : "whatsapp:".concat(payload.phone);
                            return [4 /*yield*/, this.chatService.getOrCreateConversation(from)];
                        case 1:
                            conversation = _b.sent();
                            return [4 /*yield*/, this.chatService.saveMessage({
                                    conversationId: conversation.id,
                                    senderType: 'customer',
                                    senderId: payload.phone.replace('whatsapp:', ''),
                                    content: payload.content,
                                    status: 'delivered'
                                })];
                        case 2:
                            msg = _b.sent();
                            // Broadcast to relevant rooms
                            this.server.to("conv_".concat(conversation.id)).emit('new_message', msg);
                            type = ((_a = conversation.metadata) === null || _a === void 0 ? void 0 : _a.type) || 'staff';
                            if (type === 'bank') {
                                this.server.to('room_bank').emit('conversation_updated', {
                                    conversationId: conversation.id,
                                    lastMessage: msg
                                });
                            }
                            else {
                                this.server.to('room_staff').emit('conversation_updated', {
                                    conversationId: conversation.id,
                                    lastMessage: msg
                                });
                            }
                            return [2 /*return*/, { success: true, message: msg }];
                        case 3:
                            e_2 = _b.sent();
                            this.logger.error('Simulator reply failed', e_2);
                            return [2 /*return*/, { success: false, error: e_2.message }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        ChatGateway_1.prototype.handleUserLogin = function (payload) {
            this.logger.log("Broadcasting login alert for ".concat(payload.email, " to staff"));
            this.server.to('room_staff').emit('user_activity', {
                type: payload.isNewUser ? 'registration' : 'login',
                user: {
                    email: payload.email,
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    phoneNumber: payload.phoneNumber
                },
                timestamp: new Date().toISOString()
            });
        };
        return ChatGateway_1;
    }());
    __setFunctionName(_classThis, "ChatGateway");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [(0, websockets_1.WebSocketServer)()];
        _handleJoinConversation_decorators = [(0, websockets_1.SubscribeMessage)('join_conversation')];
        _handleLeaveConversation_decorators = [(0, websockets_1.SubscribeMessage)('leave_conversation')];
        _handleSendMessage_decorators = [(0, websockets_1.SubscribeMessage)('send_message')];
        _handleSimReply_decorators = [(0, websockets_1.SubscribeMessage)('sim_customer_reply')];
        _handleUserLogin_decorators = [(0, event_emitter_1.OnEvent)('user.login')];
        __esDecorate(_classThis, null, _handleJoinConversation_decorators, { kind: "method", name: "handleJoinConversation", static: false, private: false, access: { has: function (obj) { return "handleJoinConversation" in obj; }, get: function (obj) { return obj.handleJoinConversation; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleLeaveConversation_decorators, { kind: "method", name: "handleLeaveConversation", static: false, private: false, access: { has: function (obj) { return "handleLeaveConversation" in obj; }, get: function (obj) { return obj.handleLeaveConversation; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleSendMessage_decorators, { kind: "method", name: "handleSendMessage", static: false, private: false, access: { has: function (obj) { return "handleSendMessage" in obj; }, get: function (obj) { return obj.handleSendMessage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleSimReply_decorators, { kind: "method", name: "handleSimReply", static: false, private: false, access: { has: function (obj) { return "handleSimReply" in obj; }, get: function (obj) { return obj.handleSimReply; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleUserLogin_decorators, { kind: "method", name: "handleUserLogin", static: false, private: false, access: { has: function (obj) { return "handleUserLogin" in obj; }, get: function (obj) { return obj.handleUserLogin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: function (obj) { return "server" in obj; }, get: function (obj) { return obj.server; }, set: function (obj, value) { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatGateway = _classThis;
}();
exports.ChatGateway = ChatGateway;

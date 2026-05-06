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
exports.DigilockerService = void 0;
var common_1 = require("@nestjs/common");
var DigilockerService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DigilockerService = _classThis = /** @class */ (function () {
        function DigilockerService_1() {
            // DigiLocker Production API base
            this.baseUrl = 'https://api.digitallocker.gov.in';
            this.authUrl = 'https://api.digitallocker.gov.in/public/oauth2/1/authorize';
            this.tokenUrl = 'https://api.digitallocker.gov.in/public/oauth2/1/token';
            // Issued documents endpoint (v2)
            this.issuedDocsUrl = 'https://api.digitallocker.gov.in/public/oauth2/2/files/issued';
            this.clientId = process.env.DIGILOCKER_CLIENT_ID;
            this.clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
        }
        /**
         * Generate the DigiLocker authorization URL.
         */
        DigilockerService_1.prototype.getAuthUrl = function (state, redirectUri, codeChallenge) {
            var params = new URLSearchParams({
                response_type: 'code',
                client_id: this.clientId || '',
                redirect_uri: redirectUri,
                state: state,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
            });
            return "".concat(this.authUrl, "?").concat(params.toString());
        };
        /**
         * Exchange the authorization code for an access token
         */
        DigilockerService_1.prototype.getAccessToken = function (code, redirectUri, codeVerifier) {
            return __awaiter(this, void 0, void 0, function () {
                var bodyParams, body, response, err, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log('DIGILOCKER_DEBUG: Exchanging code for token...');
                            bodyParams = {
                                grant_type: 'authorization_code',
                                code: code,
                                client_id: this.clientId || '',
                                client_secret: this.clientSecret || '',
                                redirect_uri: redirectUri,
                            };
                            if (codeVerifier) {
                                bodyParams.code_verifier = codeVerifier;
                            }
                            body = new URLSearchParams(bodyParams).toString();
                            console.log('DIGILOCKER_DEBUG: Token Request to:', this.tokenUrl);
                            console.log('DIGILOCKER_DEBUG: redirect_uri used:', redirectUri);
                            return [4 /*yield*/, fetch(this.tokenUrl, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: body,
                                })];
                        case 1:
                            response = _a.sent();
                            if (!!response.ok) return [3 /*break*/, 3];
                            return [4 /*yield*/, response.text()];
                        case 2:
                            err = _a.sent();
                            console.error('DIGILOCKER_DEBUG: Token exchange failed:', err);
                            throw new Error("DigiLocker Token Error: ".concat(err));
                        case 3: return [4 /*yield*/, response.json()];
                        case 4:
                            data = _a.sent();
                            console.log('DIGILOCKER_DEBUG: Token exchange success. access_token present:', !!data.access_token);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        /**
         * Get the list of issued documents from DigiLocker.
         * Real API response: { items: [{ uri, name, doctype, issuerid, date, description, ... }] }
         */
        DigilockerService_1.prototype.listDocuments = function (token) {
            return __awaiter(this, void 0, void 0, function () {
                var response, err, data, extractArray, allDocs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log('DIGILOCKER_DEBUG: Fetching issued documents from:', this.issuedDocsUrl);
                            return [4 /*yield*/, fetch(this.issuedDocsUrl, {
                                    method: 'GET',
                                    headers: {
                                        'Authorization': "Bearer ".concat(token),
                                        'Accept': 'application/json',
                                    }
                                })];
                        case 1:
                            response = _a.sent();
                            if (!!response.ok) return [3 /*break*/, 3];
                            return [4 /*yield*/, response.text()];
                        case 2:
                            err = _a.sent();
                            console.error('DIGILOCKER_DEBUG: Failed to fetch documents:', err);
                            throw new Error("DigiLocker Documents Error: ".concat(err));
                        case 3: return [4 /*yield*/, response.json()];
                        case 4:
                            data = _a.sent();
                            console.log('DIGILOCKER_DEBUG: Raw documents response:', JSON.stringify(data, null, 2));
                            extractArray = function (resp) {
                                var _a;
                                if (Array.isArray(resp))
                                    return resp;
                                if (Array.isArray(resp === null || resp === void 0 ? void 0 : resp.items))
                                    return resp.items;
                                if (Array.isArray(resp === null || resp === void 0 ? void 0 : resp.documents))
                                    return resp.documents;
                                if (Array.isArray(resp === null || resp === void 0 ? void 0 : resp.issued_documents))
                                    return resp.issued_documents;
                                if (Array.isArray(resp === null || resp === void 0 ? void 0 : resp.issuedDocuments))
                                    return resp.issuedDocuments;
                                if (Array.isArray((_a = resp === null || resp === void 0 ? void 0 : resp.result) === null || _a === void 0 ? void 0 : _a.items))
                                    return resp.result.items;
                                return [];
                            };
                            allDocs = extractArray(data);
                            console.log("DIGILOCKER_DEBUG: Total issued documents: ".concat(allDocs.length));
                            allDocs.forEach(function (d, i) {
                                console.log("  [".concat(i, "] doctype=\"").concat(d.doctype || d.type, "\" name=\"").concat(d.name, "\" uri=\"").concat(d.uri, "\""));
                            });
                            return [2 /*return*/, allDocs];
                    }
                });
            });
        };
        /**
         * Download a specific document file from DigiLocker by URI
         */
        DigilockerService_1.prototype.downloadDocument = function (token, uri) {
            return __awaiter(this, void 0, void 0, function () {
                var url, response, err, arrayBuffer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            url = "".concat(this.baseUrl, "/public/oauth2/1/file/").concat(encodeURIComponent(uri));
                            return [4 /*yield*/, fetch(url, {
                                    headers: {
                                        'Authorization': "Bearer ".concat(token),
                                        'Accept': 'application/pdf',
                                    }
                                })];
                        case 1:
                            response = _a.sent();
                            if (!!response.ok) return [3 /*break*/, 3];
                            return [4 /*yield*/, response.text()];
                        case 2:
                            err = _a.sent();
                            throw new Error("DigiLocker Download Error: ".concat(err));
                        case 3: return [4 /*yield*/, response.arrayBuffer()];
                        case 4:
                            arrayBuffer = _a.sent();
                            return [2 /*return*/, Buffer.from(arrayBuffer)];
                    }
                });
            });
        };
        DigilockerService_1.prototype.verifyDocument = function (token, docType) {
            return __awaiter(this, void 0, void 0, function () {
                var docs, typeMap, targetDlType_1, doc, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.listDocuments(token)];
                        case 1:
                            docs = _a.sent();
                            typeMap = {
                                'pan_student': 'PANCR',
                                'pan_coapp': 'PANCR',
                                'pan_father': 'PANCR',
                                'pan_mother': 'PANCR',
                                'aadhar_student': 'ADHAR',
                                'aadhar_coapp': 'ADHAR',
                                'aadhar_father': 'ADHAR',
                                'aadhar_mother': 'ADHAR',
                                'marksheet_10th': 'HSCER',
                                'marksheet_12th': 'HSCER',
                                'passport': 'PASPT',
                                'marksheet_degree': 'DGCTR',
                                'btech_degree': 'DGCTR',
                                'graduation_marksheet': 'MKST',
                            };
                            targetDlType_1 = typeMap[docType] || docType.toUpperCase();
                            doc = docs.find(function (item) {
                                return (item.doctype || '').toUpperCase() === targetDlType_1 ||
                                    (item.type || '').toUpperCase() === targetDlType_1;
                            });
                            if (doc) {
                                return [2 /*return*/, {
                                        isValid: true,
                                        txId: doc.uri || 'DGL-' + Math.random().toString(36).substring(7),
                                        code: 'VERIFIED_DIGILOCKER',
                                        details: {
                                            source: 'DigiLocker',
                                            document_name: doc.name || doc.description,
                                            issuer: doc.issuerid,
                                            status: 'Issued',
                                            verified_at: new Date().toISOString(),
                                        }
                                    }];
                            }
                            return [2 /*return*/, {
                                    isValid: false,
                                    code: 'DOC_NOT_FOUND',
                                    details: { message: "Could not find ".concat(docType, " in your DigiLocker account.") }
                                }];
                        case 2:
                            error_1 = _a.sent();
                            return [2 /*return*/, {
                                    isValid: false,
                                    code: 'VERIFICATION_ERROR',
                                    details: { message: error_1.message }
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return DigilockerService_1;
    }());
    __setFunctionName(_classThis, "DigilockerService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DigilockerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DigilockerService = _classThis;
}();
exports.DigilockerService = DigilockerService;

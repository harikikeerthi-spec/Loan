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
exports.DigilockerController = void 0;
var common_1 = require("@nestjs/common");
var crypto = require("crypto");
var DigilockerController = function () {
    var _classDecorators = [(0, common_1.Controller)('digilocker')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getStatus_decorators;
    var _authorize_decorators;
    var _getMockLoginPage_decorators;
    var _mockSendOtp_decorators;
    var _mockVerifyOtp_decorators;
    var _handleCallback_decorators;
    var _syncDocument_decorators;
    var DigilockerController = _classThis = /** @class */ (function () {
        function DigilockerController_1(digilockerService, usersService, supabase) {
            this.digilockerService = (__runInitializers(this, _instanceExtraInitializers), digilockerService);
            this.usersService = usersService;
            this.supabase = supabase;
            this.mockOtps = new Map();
        }
        /**
         * Step 1: Frontend redirects user here.
         * This endpoint redirects the user to the DigiLocker authorization page.
         * DigiLocker handles mobile OTP authentication — we never ask for mobile/email directly.
         */
        DigilockerController_1.prototype.getStatus = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, {
                            mockMode: process.env.DIGILOCKER_MOCK_MODE === 'true',
                            clientId: process.env.DIGILOCKER_CLIENT_ID ? '✓ Set' : '✗ Missing',
                            clientSecret: process.env.DIGILOCKER_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
                            callbackUrl: process.env.DIGILOCKER_CALLBACK_URL || 'http://localhost:5000/api/digilocker/callback',
                            message: process.env.DIGILOCKER_MOCK_MODE === 'true'
                                ? '✓ Mock mode enabled - documents will be simulated'
                                : '✓ Real mode - DigiLocker Requestor flow ready'
                        }];
                });
            });
        };
        DigilockerController_1.prototype.authorize = function (userId, docType, source, res) {
            return __awaiter(this, void 0, void 0, function () {
                var codeVerifier, codeChallenge, stateData, state, backendUrl, redirectUri, authUrl;
                return __generator(this, function (_a) {
                    if (!userId)
                        throw new common_1.BadRequestException('userId is required');
                    codeVerifier = crypto.randomBytes(32).toString('base64url');
                    codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
                    stateData = {
                        userId: userId,
                        docType: docType || 'ALL_SYNC',
                        source: source || 'vault',
                        codeVerifier: codeVerifier,
                    };
                    state = Buffer.from(JSON.stringify(stateData)).toString('base64')
                        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                    backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
                    redirectUri = process.env.DIGILOCKER_CALLBACK_URL || (backendUrl + '/api/digilocker/callback');
                    if (process.env.DIGILOCKER_MOCK_MODE === 'true') {
                        return [2 /*return*/, res.redirect(backendUrl + '/api/digilocker/mock-login?state=' + state)];
                    }
                    authUrl = this.digilockerService.getAuthUrl(state, redirectUri, codeChallenge);
                    return [2 /*return*/, res.redirect(authUrl)];
                });
            });
        };
        DigilockerController_1.prototype.getMockLoginPage = function (state, res) {
            var safeState = (state || '').replace(/[^a-zA-Z0-9_\-]/g, '');
            var decodedState = { authMethod: 'pin' };
            try {
                var base64 = safeState.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(safeState.length / 4) * 4, '=');
                decodedState = JSON.parse(Buffer.from(base64, 'base64').toString());
            }
            catch (e) { }
            var isPinless = decodedState.authMethod === 'pinless';
            var html = "\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>DigiLocker - Sign In</title>\n    <style>\n        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; }\n        body { background-color: #f7f7f7; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }\n        \n        .header { width: 100%; padding: 20px; display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 20px; }\n        .header img { height: 45px; }\n        \n        .card {\n            background: white;\n            width: 100%;\n            max-width: 440px;\n            border-radius: 12px;\n            box-shadow: 0 10px 30px rgba(0,0,0,0.08);\n            padding: 40px;\n            border-bottom: 5px solid #6366f1;\n            margin-bottom: 20px;\n        }\n        \n        .card h1 { font-size: 24px; font-weight: 700; color: #333; margin-bottom: 30px; text-align: center; }\n        \n        .tabs { display: flex; background: #f0f0f0; border-radius: 6px; padding: 4px; margin-bottom: 30px; }\n        .tab { flex: 1; padding: 12px; text-align: center; font-size: 14px; font-weight: 700; cursor: pointer; border-radius: 4px; transition: all 0.2s; color: #1a73e8; }\n        .tab.active { background: #1a73e8; color: white; }\n        \n        .input-group { margin-bottom: 20px; }\n        .input-group input {\n            width: 100%;\n            padding: 15px;\n            border: 1.5px solid #ddd;\n            border-radius: 6px;\n            font-size: 16px;\n            outline: none;\n            transition: border-color 0.2s;\n        }\n        .input-group input:focus { border-color: #1a73e8; }\n        .input-label { font-size: 11px; color: #1a73e8; margin-top: 8px; display: block; }\n\n        .btn-next {\n            width: 100%;\n            padding: 16px;\n            background: #82c91e;\n            background: linear-gradient(to bottom, #82c91e, #6eb71a);\n            color: white;\n            border: none;\n            border-radius: 8px;\n            font-size: 18px;\n            font-weight: 600;\n            cursor: pointer;\n            margin-top: 10px;\n            transition: opacity 0.2s;\n        }\n        .btn-next.submitting { opacity: 0.7; pointer-events: none; }\n        \n        .footer-links { text-align: center; font-size: 14px; color: #555; margin-top: 10px; }\n        .footer-links a { color: #1a73e8; text-decoration: none; font-weight: 600; }\n\n        .checklist {\n            background: #f8f9fa;\n            border-radius: 10px;\n            padding: 15px;\n            margin: 20px 0;\n            border: 1px dashed #ddd;\n        }\n        .check-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #666; margin-bottom: 6px; font-weight: 500; }\n        .check-icon { color: #4a9d5c; font-size: 14px; font-weight: bold; }\n\n        .error-msg { background: #fff0f0; color: #c00; padding: 12px; border-radius: 6px; font-size: 13px; margin-bottom: 20px; border: 1px solid #ffcccc; display: none; }\n\n        #otp-view { display: none; text-align: center; }\n        .otp-input { text-align: center; font-size: 24px; letter-spacing: 10px; font-weight: 800; }\n\n        #account-view { display: none; }\n        .acct-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; border: 1px solid #eee; border-radius: 10px; margin-bottom: 10px; cursor: pointer; transition: background 0.2s; }\n        .acct-row:hover { background: #f0f7ff; border-color: #1a73e8; }\n\n        #consent-view { display: none; }\n    </style>\n</head>\n<body>\n    <div class=\"header\">\n        <img src=\"https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png\" alt=\"Emblem\">\n        <img src=\"https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png\" alt=\"DigiLocker\">\n    </div>\n\n    <div class=\"card\">\n        <h1>Sign In to your account!</h1>\n\n        <!-- STEP 1: LOGIN -->\n        <div id=\"login-view\">\n            <div class=\"tabs\">\n                <div class=\"tab active\">Mobile</div>\n                <div class=\"tab\">Username</div>\n                <div class=\"tab\">Aadhaar</div>\n            </div>\n\n            <div id=\"error-box\" class=\"error-msg\"></div>\n\n            <div class=\"input-group\">\n                <input type=\"tel\" id=\"mobile-number\" placeholder=\"Mobile Number*\" maxlength=\"10\">\n                <span class=\"input-label\">Enter your registered Mobile Number</span>\n            </div>\n\n            <div class=\"checklist\" style=\"".concat(isPinless ? '' : 'display:none;', "\">\n                <div class=\"check-item\"><span class=\"check-icon\">\u2713</span> Pin-less authentication active</div>\n                <div class=\"check-item\"><span class=\"check-icon\">\u2713</span> Linked to Aadhaar Mobile Node</div>\n                <div class=\"check-item\"><span class=\"check-icon\">\u2713</span> Secure OTP-only transmission</div>\n            </div>\n\n            <button class=\"btn-next\" onclick=\"handleNext()\" id=\"btn-next\">Next</button>\n        </div>\n\n        <!-- STEP 2: OTP -->\n        <div id=\"otp-view\">\n            <p style=\"margin-bottom: 20px; font-size: 14px; color: #666;\">A 6-digit OTP has been sent to <b id=\"mask-num\"></b></p>\n            <div class=\"input-group\">\n                <input type=\"text\" id=\"otp-code\" class=\"otp-input\" placeholder=\"\u2022\u2022\u2022\u2022\u2022\u2022\" maxlength=\"6\">\n            </div>\n            <button class=\"btn-next\" onclick=\"verifyOtp()\">Sign In</button>\n            <p style=\"margin-top: 20px; font-size: 12px; color: #888;\">Didn't receive? <a href=\"#\" style=\"color:#1a73e8; font-weight:700;\">Resend OTP</a></p>\n        </div>\n\n        <!-- STEP 3: ACCOUNTS -->\n        <div id=\"account-view\">\n            <p style=\"margin-bottom: 20px; font-size: 14px; font-weight: 600; color: #333;\">Select your account</p>\n            <div id=\"account-list\"></div>\n        </div>\n\n        <!-- STEP 4: CONSENT -->\n        <div id=\"consent-view\">\n            <div style=\"text-align:center; margin-bottom: 20px;\">\n                <p style=\"font-size: 13px; color: #666;\">You are providing consent to share your data with</p>\n                <h2 style=\"font-size: 18px; color: #1a3a6b;\">VidhyaLoan</h2>\n            </div>\n            <div style=\"background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; color: #444;\">\n                <p style=\"margin-bottom: 10px;\"><b>Data requested:</b></p>\n                <p>\u2022 Aadhaar Card, PAN & Marksheets</p>\n                <p>\u2022 Profile (Name, DOB, Gender)</p>\n            </div>\n            <button class=\"btn-next\" onclick=\"redirectCallback()\" style=\"background: #1a73e8;\">Allow</button>\n            <button onclick=\"location.reload()\" style=\"width:100%; border:none; background:transparent; margin-top:15px; color:#888; font-size:14px; cursor:pointer;\">Deny</button>\n        </div>\n    </div>\n\n    <div class=\"footer-links\">\n        Do not have an account? <a href=\"#\">Sign Up</a>\n    </div>\n\n    <script>\n        const stateData = \"").concat(safeState, "\";\n        let currentMobile = \"\";\n            if (!otp || otp.length < 4) { alert('Enter the OTP received on your mobile.'); return; }\n            try {\n                const res = await fetch('/api/digilocker/mock/verify-otp', {\n                    method: 'POST',\n                    headers: { 'Content-Type': 'application/json' },\n                    body: JSON.stringify({ mobile: currentMobile, otp })\n                });\n                const data = await res.json();\n                if (data.success) {\n                    renderAccounts(data.user);\n                    document.getElementById('step-otp').style.display = 'none';\n                    document.getElementById('step-account').style.display = 'block';\n                } else {\n                    alert('Invalid OTP. (Hint: use 123456 in development)');\n                }\n            } catch (e) { alert('Error verifying OTP. Please try again.'); }\n        }\n\n        function renderAccounts(user) {\n            const list = document.getElementById('account-list');\n            if (user) {\n                list.innerHTML =\n                    '<div class=\"acct-card\" onclick=\"gotoConsent()\">' +\n                        '<div style=\"display:flex;align-items:center;\">' +\n                            '<div class=\"acct-avatar\">' + user.firstName[0] + '</div>' +\n                            '<div class=\"acct-info\">' +\n                                '<p>' + user.firstName.toUpperCase() + ' ' + (user.lastName || '').toUpperCase() + '</p>' +\n                                '<small>\u2714 Verified DigiLocker Account</small>' +\n                            '</div>' +\n                        '</div>' +\n                        '<div class=\"acct-chevron\">\u203A</div>' +\n                    '</div>';\n            } else {\n                list.innerHTML = '<p style=\"color:#888;font-size:14px;\">No account found.</p>';\n            }\n        }\n\n        function gotoConsent() {\n            document.getElementById('step-account').style.display = 'none';\n            document.getElementById('step-consent').style.display = 'block';\n        }\n\n        function grantAccess() {\n            window.location.href = '/api/digilocker/callback?code=mock_code&state=' + state;\n        }\n    </script>\n</body>\n</html>\n        ");
            res.send(html);
        };
        DigilockerController_1.prototype.mockSendOtp = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var user, otp;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersService.findByMobile(body.mobile)];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.BadRequestException('Account not found with this mobile number.');
                            }
                            otp = Math.floor(100000 + Math.random() * 900000).toString();
                            this.mockOtps.set(body.mobile, otp);
                            console.log('--- DIGILOCKER MOCK OTP ---');
                            console.log('MOBILE: ' + body.mobile);
                            console.log('OTP: ' + otp);
                            console.log('---------------------------');
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        DigilockerController_1.prototype.mockVerifyOtp = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var storedOtp, user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            storedOtp = this.mockOtps.get(body.mobile);
                            if (!(body.otp === storedOtp || body.otp === '123456')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.usersService.findByMobile(body.mobile)];
                        case 1:
                            user = _a.sent();
                            if (!user)
                                throw new common_1.BadRequestException('Account vanished!');
                            return [2 /*return*/, {
                                    success: true,
                                    user: { firstName: user.firstName, lastName: user.lastName }
                                }];
                        case 2: return [2 /*return*/, { success: false }];
                    }
                });
            });
        };
        /**
         * Step 2: DigiLocker redirects here after user grants consent.
         * Backend exchanges the authorization code for an access token,
         * then fetches the user's documents from DigiLocker.
         */
        DigilockerController_1.prototype.handleCallback = function (query, res) {
            return __awaiter(this, void 0, void 0, function () {
                var code, state, error, error_description, frontendUrl, base64, decodedState, userId, docType, source, redirectPath, backendUrl, redirectUri, mockMode, tokenData, accessToken, error_1, errMsg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            code = query.code, state = query.state, error = query.error, error_description = query.error_description;
                            frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                            console.log('===== DIGILOCKER CALLBACK START =====');
                            console.log('State received:', state ? '✓ Yes' : '✗ No');
                            console.log('Code received:', code ? '✓ Yes' : '✗ No');
                            console.log('Error from DigiLocker:', error || 'No error');
                            if (error) {
                                console.log('Redirecting to error page...');
                                return [2 /*return*/, res.redirect(frontendUrl + '/document-vault/digilocker?status=error&message=' + encodeURIComponent(error_description || error))];
                            }
                            if (!code || !state) {
                                console.log('Missing code or state, redirecting to error');
                                return [2 /*return*/, res.redirect(frontendUrl + '/document-vault/digilocker?status=error&message=' + encodeURIComponent('Missing authorization code or state'))];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 7, , 8]);
                            base64 = state
                                .replace(/-/g, '+')
                                .replace(/_/g, '/')
                                .padEnd(Math.ceil(state.length / 4) * 4, '=');
                            decodedState = JSON.parse(Buffer.from(base64, 'base64').toString());
                            userId = decodedState.userId, docType = decodedState.docType, source = decodedState.source;
                            console.log('✓ State decoded:', { userId: userId, docType: docType, source: source });
                            redirectPath = source === 'portal' ? '/document-vault/digilocker' : '/document-vault';
                            backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
                            redirectUri = process.env.DIGILOCKER_CALLBACK_URL || (backendUrl + '/api/digilocker/callback');
                            mockMode = process.env.DIGILOCKER_MOCK_MODE === 'true';
                            console.log('Mode:', mockMode ? 'MOCK' : 'REAL');
                            if (!mockMode) return [3 /*break*/, 3];
                            // Mock mode: simulate document fetch without calling DigiLocker APIs
                            console.log('Processing mock documents for userId:', userId);
                            return [4 /*yield*/, this.processMockDocuments(userId, docType)];
                        case 2:
                            _a.sent();
                            console.log('✓ Mock documents processed');
                            return [3 /*break*/, 6];
                        case 3:
                            // Real mode: exchange authorization code for access token (with PKCE code_verifier)
                            console.log('Exchanging code for token...');
                            return [4 /*yield*/, this.digilockerService.getAccessToken(code, redirectUri, decodedState.codeVerifier)];
                        case 4:
                            tokenData = _a.sent();
                            accessToken = tokenData.access_token;
                            console.log('✓ Access token obtained');
                            // Fetch and store documents using the access token
                            console.log('Fetching and storing documents...');
                            return [4 /*yield*/, this.fetchAndStoreDocuments(userId, accessToken, docType)];
                        case 5:
                            _a.sent();
                            console.log('✓ Documents stored');
                            _a.label = 6;
                        case 6:
                            console.log('✓ Redirecting to:', redirectPath);
                            console.log('===== DIGILOCKER CALLBACK END (SUCCESS) =====');
                            return [2 /*return*/, res.redirect(frontendUrl + redirectPath + '?status=success&message=' + encodeURIComponent('Documents fetched from DigiLocker'))];
                        case 7:
                            error_1 = _a.sent();
                            console.error('❌ DigiLocker callback error:', error_1);
                            errMsg = error_1 instanceof Error ? error_1.message : String(error_1);
                            console.log('===== DIGILOCKER CALLBACK END (ERROR) =====');
                            return [2 /*return*/, res.redirect(frontendUrl + '/document-vault/digilocker?status=error&message=' + encodeURIComponent('Failed to process DigiLocker response: ' + errMsg))];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        DigilockerController_1.prototype.normalizeDigilockerType = function (rawDoc) {
            // Real DigiLocker API uses 'doctype' field; mock/legacy may use 'type'
            var candidates = [
                rawDoc === null || rawDoc === void 0 ? void 0 : rawDoc.doctype, // Real API field name
                rawDoc === null || rawDoc === void 0 ? void 0 : rawDoc.type,
                rawDoc === null || rawDoc === void 0 ? void 0 : rawDoc.docType,
                rawDoc === null || rawDoc === void 0 ? void 0 : rawDoc.documentType,
                rawDoc === null || rawDoc === void 0 ? void 0 : rawDoc.issuerDocType,
            ]
                .filter(Boolean)
                .map(function (value) { return String(value).toUpperCase().trim(); });
            if (candidates.length > 0) {
                return candidates[0];
            }
            // Try to extract from URI (e.g., in.gov.cbse-SSCER-1234)
            var uri = String((rawDoc === null || rawDoc === void 0 ? void 0 : rawDoc.uri) || (rawDoc === null || rawDoc === void 0 ? void 0 : rawDoc.id) || '');
            var uriMatch = uri.match(/(PANCR|ADHAR|AADHAR|10TH|12TH|SSCER|HSCER|PASPT|DGCTR|MKST)/i);
            if (uriMatch === null || uriMatch === void 0 ? void 0 : uriMatch[1]) {
                return uriMatch[1].toUpperCase();
            }
            return '';
        };
        /**
         * Mock document processing for development/testing
         */
        DigilockerController_1.prototype.processMockDocuments = function (userId, docType) {
            return __awaiter(this, void 0, void 0, function () {
                var mockDocs, syncMap, reverseMap, _i, mockDocs_1, diDoc, internalTypes, _a, internalTypes_1, type, mappedDlType_1, diDoc;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            console.log('📋 Mock processor started - userId:', userId, 'docType:', docType);
                            mockDocs = [
                                { type: 'PANCR', name: 'PAN Card' },
                                { type: 'ADHAR', name: 'Aadhar Card' },
                                { type: '10TH', name: '10th Marksheet' },
                                { type: '12TH', name: '12th Marksheet' },
                                { type: 'DGCTR', name: 'B.Tech / Degree Certificate' },
                                { type: 'MKST', name: 'Graduation Marksheets' }
                            ];
                            syncMap = {
                                'pan_student': 'PANCR', 'pan_coapp': 'PANCR', 'pan_father': 'PANCR', 'pan_mother': 'PANCR',
                                'aadhar_student': 'ADHAR', 'aadhar_coapp': 'ADHAR', 'aadhar_father': 'ADHAR', 'aadhar_mother': 'ADHAR',
                                'marksheet_10th': '10TH', 'marksheet_12th': '12TH', 'marksheet_degree': 'DGCTR', 'passport': 'PASPT'
                            };
                            reverseMap = {
                                'PANCR': ['pan_student'],
                                'ADHAR': ['aadhar_student'],
                                '10TH': ['marksheet_10th'],
                                'SSCER': ['marksheet_10th'],
                                '12TH': ['marksheet_12th'],
                                'HSCER': ['marksheet_12th'],
                                'DGCTR': ['marksheet_degree'],
                                'MKST': ['marksheet_degree'],
                                'PASPT': ['passport'],
                            };
                            if (!(docType === 'ALL_SYNC')) return [3 /*break*/, 7];
                            console.log('🔄 Processing ALL documents...');
                            _i = 0, mockDocs_1 = mockDocs;
                            _b.label = 1;
                        case 1:
                            if (!(_i < mockDocs_1.length)) return [3 /*break*/, 6];
                            diDoc = mockDocs_1[_i];
                            internalTypes = reverseMap[diDoc.type] || [];
                            console.log("  - ".concat(diDoc.type, " -> ").concat(internalTypes.join(', ')));
                            _a = 0, internalTypes_1 = internalTypes;
                            _b.label = 2;
                        case 2:
                            if (!(_a < internalTypes_1.length)) return [3 /*break*/, 5];
                            type = internalTypes_1[_a];
                            return [4 /*yield*/, this.usersService.upsertUserDocument(userId, type, {
                                    uploaded: false,
                                    status: 'available_in_digilocker',
                                    digilockerTxId: 'MOCK_TX_' + Date.now(),
                                    verificationMetadata: diDoc,
                                })];
                        case 3:
                            _b.sent();
                            console.log("    \u2713 Upserted ".concat(type, " with status available_in_digilocker"));
                            _b.label = 4;
                        case 4:
                            _a++;
                            return [3 /*break*/, 2];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [3 /*break*/, 9];
                        case 7:
                            // Specific doc sync
                            console.log('🎯 Processing specific document:', docType);
                            mappedDlType_1 = syncMap[docType] || docType;
                            diDoc = mockDocs.find(function (d) { return d.type === mappedDlType_1; }) || { type: mappedDlType_1, name: docType };
                            console.log("  Mapped ".concat(docType, " -> ").concat(mappedDlType_1));
                            return [4 /*yield*/, this.usersService.upsertUserDocument(userId, docType, {
                                    uploaded: false,
                                    status: 'available_in_digilocker',
                                    digilockerTxId: 'MOCK_TX_' + Date.now(),
                                    verificationMetadata: diDoc,
                                })];
                        case 8:
                            _b.sent();
                            console.log("    \u2713 Upserted ".concat(docType, " with status available_in_digilocker"));
                            _b.label = 9;
                        case 9:
                            console.log('✓ Mock processing complete');
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Fetch documents from DigiLocker using access token and store them
         */
        DigilockerController_1.prototype.fetchAndStoreDocuments = function (userId, accessToken, docType) {
            return __awaiter(this, void 0, void 0, function () {
                var documents, syncMap, reverseMap, aliasToCanonical, upsertCount, _i, documents_1, doc, normalizedType, dlType, mappedDlType, internalTypes, _a, internalTypes_2, type;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            console.log('🔍 Fetching documents from DigiLocker...');
                            return [4 /*yield*/, this.digilockerService.listDocuments(accessToken)];
                        case 1:
                            documents = _b.sent();
                            console.log("\u2713 Retrieved ".concat(documents.length, " documents from DigiLocker"));
                            syncMap = {
                                'pan_student': 'PANCR', 'pan_coapp': 'PANCR', 'pan_father': 'PANCR', 'pan_mother': 'PANCR',
                                'aadhar_student': 'ADHAR', 'aadhar_coapp': 'ADHAR', 'aadhar_father': 'ADHAR', 'aadhar_mother': 'ADHAR',
                                'marksheet_10th': '10TH', 'marksheet_12th': '12TH', 'marksheet_degree': 'DGCTR', 'passport': 'PASPT'
                            };
                            reverseMap = {
                                'PANCR': ['pan_student'],
                                'ADHAR': ['aadhar_student'],
                                'AADHAR': ['aadhar_student'],
                                '10TH': ['marksheet_10th'],
                                '12TH': ['marksheet_12th'],
                                'SSCER': ['marksheet_10th'],
                                'HSCER': ['marksheet_12th'],
                                'PASPT': ['passport'],
                                'DGCTR': ['marksheet_degree'],
                                'MKST': ['marksheet_degree'],
                            };
                            aliasToCanonical = {
                                'AADHAR': 'ADHAR',
                                'SSC': '10TH',
                                'HSC': '12TH',
                            };
                            upsertCount = 0;
                            _i = 0, documents_1 = documents;
                            _b.label = 2;
                        case 2:
                            if (!(_i < documents_1.length)) return [3 /*break*/, 11];
                            doc = documents_1[_i];
                            normalizedType = this.normalizeDigilockerType(doc);
                            console.log("  Processing: ".concat(JSON.stringify(doc).substring(0, 100), "... -> normalized: ").concat(normalizedType));
                            dlType = aliasToCanonical[normalizedType] || normalizedType;
                            if (!dlType) {
                                console.log("    \u26A0\uFE0F  Could not normalize type, skipping");
                                return [3 /*break*/, 10];
                            }
                            if (!(docType !== 'ALL_SYNC')) return [3 /*break*/, 6];
                            mappedDlType = aliasToCanonical[syncMap[docType] || docType] || (syncMap[docType] || docType);
                            if (!(dlType === mappedDlType)) return [3 /*break*/, 4];
                            console.log("    \u2713 Matched! Upserting ".concat(docType, " (").concat(dlType, ")"));
                            return [4 /*yield*/, this.usersService.upsertUserDocument(userId, docType, {
                                    uploaded: false,
                                    status: 'available_in_digilocker',
                                    digilockerTxId: doc.id || doc.uri || ('DGL_' + Date.now()),
                                    verificationMetadata: {
                                        source: 'DigiLocker',
                                        document_name: doc.name || doc.description,
                                        type: dlType,
                                        verified_at: new Date().toISOString(),
                                    },
                                })];
                        case 3:
                            _b.sent();
                            upsertCount++;
                            return [3 /*break*/, 5];
                        case 4:
                            console.log("    \u26A0\uFE0F  Type mismatch: expected ".concat(mappedDlType, ", got ").concat(dlType));
                            _b.label = 5;
                        case 5: return [3 /*break*/, 10];
                        case 6:
                            internalTypes = reverseMap[dlType] || [];
                            console.log("    ALL_SYNC: ".concat(dlType, " -> [").concat(internalTypes.join(', '), "]"));
                            _a = 0, internalTypes_2 = internalTypes;
                            _b.label = 7;
                        case 7:
                            if (!(_a < internalTypes_2.length)) return [3 /*break*/, 10];
                            type = internalTypes_2[_a];
                            return [4 /*yield*/, this.usersService.upsertUserDocument(userId, type, {
                                    uploaded: false,
                                    status: 'available_in_digilocker',
                                    digilockerTxId: doc.id || doc.uri || ('DGL_' + Date.now()),
                                    verificationMetadata: {
                                        source: 'DigiLocker',
                                        document_name: doc.name || doc.description,
                                        type: dlType,
                                        verified_at: new Date().toISOString(),
                                    },
                                })];
                        case 8:
                            _b.sent();
                            console.log("      \u2713 Upserted ".concat(type));
                            upsertCount++;
                            _b.label = 9;
                        case 9:
                            _a++;
                            return [3 /*break*/, 7];
                        case 10:
                            _i++;
                            return [3 /*break*/, 2];
                        case 11:
                            console.log("\u2713 Completed - upserted ".concat(upsertCount, " documents"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        DigilockerController_1.prototype.syncDocument = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, docType, _a, doc, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            userId = body.userId, docType = body.docType;
                            return [4 /*yield*/, this.supabase.getClient()
                                    .from('UserDocument')
                                    .select('*')
                                    .eq('userId', userId)
                                    .eq('docType', docType)
                                    .single()];
                        case 1:
                            _a = _b.sent(), doc = _a.data, error = _a.error;
                            if (!doc)
                                throw new common_1.BadRequestException('Document not found');
                            return [4 /*yield*/, this.usersService.upsertUserDocument(userId, docType, {
                                    status: 'verified',
                                    uploaded: true,
                                    verifiedAt: new Date(),
                                    filePath: './public/mock/digilocker/' + docType + '.pdf',
                                    digilockerTxId: doc.digilockerTxId,
                                    verificationMetadata: doc.verificationMetadata
                                })];
                        case 2:
                            _b.sent();
                            return [2 /*return*/, { success: true, message: 'Document synced successfully' }];
                    }
                });
            });
        };
        return DigilockerController_1;
    }());
    __setFunctionName(_classThis, "DigilockerController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getStatus_decorators = [(0, common_1.Get)('status')];
        _authorize_decorators = [(0, common_1.Get)('authorize')];
        _getMockLoginPage_decorators = [(0, common_1.Get)('mock-login')];
        _mockSendOtp_decorators = [(0, common_1.Post)('mock/send-otp')];
        _mockVerifyOtp_decorators = [(0, common_1.Post)('mock/verify-otp')];
        _handleCallback_decorators = [(0, common_1.Get)('callback')];
        _syncDocument_decorators = [(0, common_1.Post)('sync')];
        __esDecorate(_classThis, null, _getStatus_decorators, { kind: "method", name: "getStatus", static: false, private: false, access: { has: function (obj) { return "getStatus" in obj; }, get: function (obj) { return obj.getStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _authorize_decorators, { kind: "method", name: "authorize", static: false, private: false, access: { has: function (obj) { return "authorize" in obj; }, get: function (obj) { return obj.authorize; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMockLoginPage_decorators, { kind: "method", name: "getMockLoginPage", static: false, private: false, access: { has: function (obj) { return "getMockLoginPage" in obj; }, get: function (obj) { return obj.getMockLoginPage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _mockSendOtp_decorators, { kind: "method", name: "mockSendOtp", static: false, private: false, access: { has: function (obj) { return "mockSendOtp" in obj; }, get: function (obj) { return obj.mockSendOtp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _mockVerifyOtp_decorators, { kind: "method", name: "mockVerifyOtp", static: false, private: false, access: { has: function (obj) { return "mockVerifyOtp" in obj; }, get: function (obj) { return obj.mockVerifyOtp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleCallback_decorators, { kind: "method", name: "handleCallback", static: false, private: false, access: { has: function (obj) { return "handleCallback" in obj; }, get: function (obj) { return obj.handleCallback; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncDocument_decorators, { kind: "method", name: "syncDocument", static: false, private: false, access: { has: function (obj) { return "syncDocument" in obj; }, get: function (obj) { return obj.syncDocument; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DigilockerController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DigilockerController = _classThis;
}();
exports.DigilockerController = DigilockerController;

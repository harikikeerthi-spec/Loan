
import { Controller, Get, Post, Body, Query, Res, BadRequestException } from '@nestjs/common';
import { DigilockerService } from './digilocker.service';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase/supabase.service';
import type { Response } from 'express';
import * as crypto from 'crypto';

@Controller('digilocker')
export class DigilockerController {
    constructor(
        private readonly digilockerService: DigilockerService,
        private readonly usersService: UsersService,
        private readonly supabase: SupabaseService,
    ) { }

    private mockOtps = new Map<string, string>();

    /**
     * Step 1: Frontend redirects user here.
     * This endpoint redirects the user to the DigiLocker authorization page.
     * DigiLocker handles mobile OTP authentication — we never ask for mobile/email directly.
     */
    @Get('status')
    async getStatus() {
        return {
            mockMode: process.env.DIGILOCKER_MOCK_MODE === 'true',
            clientId: process.env.DIGILOCKER_CLIENT_ID ? '✓ Set' : '✗ Missing',
            clientSecret: process.env.DIGILOCKER_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
            callbackUrl: process.env.DIGILOCKER_CALLBACK_URL || 'http://localhost:5000/api/digilocker/callback',
            message: process.env.DIGILOCKER_MOCK_MODE === 'true'
                ? '✓ Mock mode enabled - documents will be simulated'
                : '✓ Real mode - DigiLocker Requestor flow ready'
        };
    }

    @Get('authorize')
    async authorize(
        @Query('userId') userId: string,
        @Query('docType') docType: string,
        @Query('source') source: string,
        @Res() res: Response,
    ) {
        if (!userId) throw new BadRequestException('userId is required');

        // Generate PKCE code_verifier and code_challenge (required by DigiLocker)
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

        const stateData = {
            userId,
            docType: docType || 'ALL_SYNC',
            source: source || 'vault',
            codeVerifier,
        };
        const state = Buffer.from(JSON.stringify(stateData)).toString('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const redirectUri = process.env.DIGILOCKER_CALLBACK_URL || (backendUrl + '/api/digilocker/callback');

        if (process.env.DIGILOCKER_MOCK_MODE === 'true') {
            return res.redirect(backendUrl + '/api/digilocker/mock-login?state=' + state);
        }

        const authUrl = this.digilockerService.getAuthUrl(state, redirectUri, codeChallenge);
        return res.redirect(authUrl);
    }

    @Get('mock-login')
    getMockLoginPage(@Query('state') state: string, @Res() res) {
        const safeState = (state || '').replace(/[^a-zA-Z0-9_\-]/g, '');
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeriPehchaan | DigiLocker Sign In</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #e8edf2;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 30px 16px 60px;
        }
        .header {
            text-align: center;
            margin-bottom: 22px;
        }
        .header-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        .header-logo img.emblem { width: 54px; }
        .header-title {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        .header-title .mp { font-size: 26px; font-weight: 800; color: #e77600; letter-spacing: -0.5px; }
        .header-title .mp span { color: #1a6bb5; }
        .header-title .sso { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; color: #555; text-transform: uppercase; margin-top: -4px; }
        .header-logos {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            margin-top: 8px;
        }
        .header-logos img { height: 18px; opacity: 0.85; }

        .card {
            background: white;
            width: 100%;
            max-width: 500px;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1);
            overflow: hidden;
            border-bottom: 4px solid #6633cc;
        }
        .card-title {
            text-align: center;
            padding: 28px 24px 12px;
            font-size: 18px;
            font-weight: 600;
            color: #222;
            border-bottom: 1px solid #f0f0f0;
        }
        .card-title span { color: #1a6bb5; font-weight: 700; }

        /* TABS */
        .tabs {
            display: flex;
            border-bottom: 1px solid #e0e0e0;
        }
        .tab-btn {
            flex: 1;
            padding: 14px 8px;
            font-size: 14px;
            font-weight: 600;
            border: none;
            background: transparent;
            color: #1a6bb5;
            cursor: pointer;
            transition: all 0.15s;
        }
        .tab-btn.active {
            background: #1a6bb5;
            color: white;
        }
        .tab-btn:hover:not(.active) { background: #f0f6ff; }

        /* FORM */
        .form-body { padding: 24px 32px; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .form-group { margin-bottom: 16px; }
        .form-control {
            width: 100%;
            padding: 11px 14px;
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 6px;
            outline: none;
            transition: border-color 0.2s;
            color: #333;
        }
        .form-control:focus { border-color: #1a6bb5; box-shadow: 0 0 0 2px rgba(26,107,181,0.1); }
        .mobile-wrap { display: flex; gap: 8px; }
        .flag-box {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 12px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 14px;
            color: #333;
            white-space: nowrap;
            font-weight: 600;
        }
        select.form-control { background: white; }
        .forgot-link {
            text-align: right;
            font-size: 12.5px;
            color: #1a6bb5;
            text-decoration: none;
            display: block;
            margin-top: 4px;
            cursor: pointer;
        }
        .checkbox-group { display: flex; align-items: center; gap: 10px; margin: 12px 0; font-size: 13px; color: #444; }
        .checkbox-group input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #1a6bb5; }
        .checkbox-group a { color: #1a6bb5; text-decoration: none; font-weight: 600; }
        .btn-signin {
            width: 100%;
            padding: 13px;
            font-size: 16px;
            font-weight: 700;
            background: #4a9d5c;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            letter-spacing: 0.3px;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 8px;
        }
        .btn-signin:hover { background: #3d8a4e; }
        .loader { border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .signup-link { text-align: center; font-size: 13px; color: #555; margin-top: 16px; }
        .signup-link a { color: #1a6bb5; font-weight: 700; text-decoration: none; }
        .or-sep { display: flex; align-items: center; gap: 12px; margin: 16px 0; color: #aaa; font-size: 12px; font-weight: 600; }
        .or-sep::before, .or-sep::after { content: ''; flex: 1; height: 1px; background: #e0e0e0; }
        .continue-with { text-align: center; font-size: 13px; color: #555; margin-bottom: 10px; }
        .sso-logos { display: flex; justify-content: center; gap: 20px; }
        .sso-logos img { height: 36px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s; }
        .sso-logos img:hover { opacity: 1; }

        .error-box { background: #fff0f0; border: 1px solid #ffcccc; color: #c00; border-radius: 6px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px; display: none; }

        /* OTP Step */
        .otp-step { padding: 32px; text-align: center; }
        .otp-icon { width: 60px; height: 60px; background: #e8f0fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; }
        .otp-step h2 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .otp-step p { color: #666; font-size: 14px; margin-bottom: 24px; }
        .otp-input { text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 12px; }
        .otp-resend { display: flex; justify-content: space-between; font-size: 12px; margin-top: 12px; color: #888; }
        .otp-resend a { color: #1a6bb5; font-weight: 700; text-decoration: none; cursor: pointer; }

        /* Account Step */
        .acct-step { padding: 28px 32px; }
        .acct-step h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
        .acct-card {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            margin-bottom: 12px;
            transition: all 0.15s;
        }
        .acct-card:hover { border-color: #1a6bb5; background: #f0f6ff; }
        .acct-avatar { width: 42px; height: 42px; background: #1a6bb5; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; margin-right: 14px; text-transform: uppercase; }
        .acct-info p { font-weight: 700; font-size: 15px; text-transform: uppercase; }
        .acct-info small { color: #4a9d5c; font-size: 11px; font-weight: 600; }
        .acct-chevron { color: #bbb; font-size: 22px; }

        /* Consent Step */
        .consent-step { }
        .consent-header { padding: 24px; background: #f8f9fa; border-bottom: 1px solid #eee; text-align: center; }
        .consent-header img { height: 40px; margin-bottom: 10px; }
        .consent-header p { font-size: 13px; color: #666; }
        .consent-header h3 { font-size: 18px; font-weight: 700; color: #1a3a6b; margin-top: 4px; }
        .consent-body { padding: 28px 32px; }
        .consent-item { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px; }
        .consent-check { width: 20px; height: 20px; background: #4a9d5c; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white; font-size: 12px; font-weight: 700; }
        .btn-allow { width: 100%; padding: 14px; background: #004791; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 24px; transition: background 0.2s; }
        .btn-allow:hover { background: #003366; }
        .btn-deny { width: 100%; padding: 11px; background: transparent; color: #888; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; cursor: pointer; margin-top: 8px; }
        .btn-deny:hover { background: #f5f5f5; }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-logo">
            <img class="emblem" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png" alt="Ashoka Emblem">
            <div class="header-title">
                <div class="mp">Meri<span>Pehchaan</span></div>
                <div class="sso">Single Sign-On Service</div>
            </div>
        </div>
        <div class="header-logos" style="margin-top:10px;">
            <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png" alt="DigiLocker">
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Digital_India_logo.png" alt="Digital India">
        </div>
    </div>

    <!-- Login Card -->
    <div class="card" id="login-card">

        <!-- ===== STEP: LOGIN ===== -->
        <div id="step-login">
            <div class="card-title">Sign In to your account via <span>DigiLocker</span></div>

            <div class="tabs">
                <button class="tab-btn active" id="tab-mobile" onclick="switchTab('mobile')">Mobile</button>
                <button class="tab-btn" id="tab-username" onclick="switchTab('username')">Username</button>
                <button class="tab-btn" id="tab-others" onclick="switchTab('others')">Others</button>
            </div>

            <div class="form-body">
                <div id="error-box" class="error-box"></div>

                <!-- Mobile Tab -->
                <div class="tab-content active" id="content-mobile">
                    <div class="form-group">
                        <div class="mobile-wrap">
                            <div class="flag-box">🇮🇳 +91</div>
                            <input type="tel" id="phone-input" class="form-control" placeholder="Mobile*" maxlength="10">
                        </div>
                    </div>
                    <div class="form-group">
                        <input type="password" id="mobile-pin" class="form-control" placeholder="PIN*" maxlength="6">
                        <a class="forgot-link">Forgot security PIN?</a>
                    </div>
                </div>

                <!-- Username Tab -->
                <div class="tab-content" id="content-username">
                    <div class="form-group">
                        <input type="text" id="username-input" class="form-control" placeholder="Username*">
                    </div>
                    <div class="form-group">
                        <input type="password" id="username-pin" class="form-control" placeholder="PIN*" maxlength="6">
                        <a class="forgot-link">Forgot security PIN?</a>
                    </div>
                </div>

                <!-- Others Tab -->
                <div class="tab-content" id="content-others">
                    <div class="form-group">
                        <select class="form-control" id="others-id-type">
                            <option value="">-- Select ID --</option>
                            <option value="aadhaar">Aadhaar</option>
                            <option value="pan">PAN</option>
                            <option value="vid">Virtual ID (VID)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <input type="text" id="others-id-num" class="form-control" placeholder="Enter ID / Number*">
                    </div>
                    <div class="form-group">
                        <input type="password" id="others-pin" class="form-control" placeholder="PIN*" maxlength="6">
                        <a class="forgot-link">Forgot security PIN?</a>
                    </div>
                </div>

                <div class="checkbox-group">
                    <input type="checkbox" id="pinless">
                    <label for="pinless">PIN less authentication</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="consent-check">
                    <label for="consent-check">I consent to <a href="#">terms of use.</a></label>
                </div>

                <button class="btn-signin" id="signin-btn" onclick="handleSignIn()">
                    <span id="btn-label">Sign In</span>
                </button>

                <div class="signup-link" style="margin-top:18px;">New user? <a href="#">Sign up</a></div>
                <div class="or-sep">OR</div>
                <div class="continue-with">Continue with</div>
                <div class="sso-logos">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/E-pramaan_logo.svg/320px-E-pramaan_logo.svg.png" alt="e-Pramaan" onerror="this.style.display='none'">
                    <div style="background:#1a3a6b;color:white;padding:8px 16px;border-radius:4px;font-size:13px;font-weight:700;cursor:pointer;">🇮🇳 JanParichay</div>
                </div>
            </div>
        </div>

        <!-- ===== STEP: OTP ===== -->
        <div id="step-otp" class="otp-step" style="display:none;">
            <div class="otp-icon">📲</div>
            <h2>Verify OTP</h2>
            <p>A 6-digit OTP has been sent to your registered mobile number <b id="mask-mobile"></b></p>
            <div class="form-group">
                <input type="text" id="otp-input" class="form-control otp-input" placeholder="• • • • • •" maxlength="6">
            </div>
            <button class="btn-signin" onclick="verifyOtp()">Submit OTP</button>
            <div class="otp-resend">
                <span>Didn't receive? Wait 60s</span>
                <a>Resend OTP</a>
            </div>
        </div>

        <!-- ===== STEP: ACCOUNT SELECTION ===== -->
        <div id="step-account" class="acct-step" style="display:none;">
            <h2>Select your account</h2>
            <div id="account-list"></div>
            <div style="text-align:center;margin-top:20px;font-size:13px;color:#888;">
                Not your account? <a href="#" style="color:#1a6bb5;font-weight:700;" onclick="location.reload()">Try again</a>
            </div>
        </div>

        <!-- ===== STEP: CONSENT ===== -->
        <div id="step-consent" style="display:none;">
            <div class="consent-header">
                <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png" alt="DigiLocker">
                <p>You are providing consent to share your data with</p>
                <h3>VidhyaLoan</h3>
            </div>
            <div class="consent-body">
                <p style="font-size:14px;font-weight:600;margin-bottom:16px;">VidhyaLoan will receive the following:</p>
                <div class="consent-item">
                    <div class="consent-check">✓</div>
                    <p style="font-size:14px;">Aadhaar Card, PAN Card &amp; Academic Certificates</p>
                </div>
                <div class="consent-item">
                    <div class="consent-check">✓</div>
                    <p style="font-size:14px;">Basic profile — Name, Date of Birth, Gender</p>
                </div>
                <button class="btn-allow" onclick="grantAccess()">Allow Access</button>
                <button class="btn-deny" onclick="window.location.href='/document-vault'">Deny</button>
                <p style="font-size:11px;color:#aaa;text-align:center;margin-top:12px;">By clicking Allow, you agree to the DigiLocker terms of service.</p>
            </div>
        </div>
    </div>

    <script>
        let currentMobile = "";
        let activeTab = "mobile";
        const state = "${safeState}";

        function switchTab(tab) {
            activeTab = tab;
            ['mobile', 'username', 'others'].forEach(t => {
                document.getElementById('tab-' + t).classList.toggle('active', t === tab);
                document.getElementById('content-' + t).classList.toggle('active', t === tab);
            });
            document.getElementById('error-box').style.display = 'none';
        }

        function showError(msg) {
            const box = document.getElementById('error-box');
            box.innerText = msg;
            box.style.display = 'block';
        }

        async function handleSignIn() {
            const consentChecked = document.getElementById('consent-check').checked;
            if (!consentChecked) { showError('Please consent to the terms of use to continue.'); return; }

            let mobileVal = "";
            if (activeTab === 'mobile') {
                mobileVal = document.getElementById('phone-input').value.trim();
                if (!mobileVal || mobileVal.length < 10) { showError('Enter a valid 10-digit mobile number.'); return; }
            } else {
                // For Username/Others tab in mock mode, use a simulated mobile
                mobileVal = "9000000000";
            }

            const btn = document.getElementById('signin-btn');
            const lbl = document.getElementById('btn-label');
            currentMobile = mobileVal;
            lbl.innerHTML = '<div class="loader"></div>';
            btn.disabled = true;
            document.getElementById('error-box').style.display = 'none';

            try {
                const resp = await fetch('/api/digilocker/mock/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile: mobileVal })
                });
                const data = await resp.json();
                if (!resp.ok) { showError(data.message || 'Account not found. Please check your mobile number.'); return; }

                document.getElementById('mask-mobile').innerText = 'XXXXXX' + mobileVal.slice(-4);
                document.getElementById('step-login').style.display = 'none';
                document.getElementById('step-otp').style.display = 'block';
            } catch (e) {
                showError('Service unavailable. Please try again later.');
            } finally {
                lbl.innerText = 'Sign In';
                btn.disabled = false;
            }
        }

        async function verifyOtp() {
            const otp = document.getElementById('otp-input').value.trim();
            if (!otp || otp.length < 4) { alert('Enter the OTP received on your mobile.'); return; }
            try {
                const res = await fetch('/api/digilocker/mock/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile: currentMobile, otp })
                });
                const data = await res.json();
                if (data.success) {
                    renderAccounts(data.user);
                    document.getElementById('step-otp').style.display = 'none';
                    document.getElementById('step-account').style.display = 'block';
                } else {
                    alert('Invalid OTP. (Hint: use 123456 in development)');
                }
            } catch (e) { alert('Error verifying OTP. Please try again.'); }
        }

        function renderAccounts(user) {
            const list = document.getElementById('account-list');
            if (user) {
                list.innerHTML =
                    '<div class="acct-card" onclick="gotoConsent()">' +
                        '<div style="display:flex;align-items:center;">' +
                            '<div class="acct-avatar">' + user.firstName[0] + '</div>' +
                            '<div class="acct-info">' +
                                '<p>' + user.firstName.toUpperCase() + ' ' + (user.lastName || '').toUpperCase() + '</p>' +
                                '<small>✔ Verified DigiLocker Account</small>' +
                            '</div>' +
                        '</div>' +
                        '<div class="acct-chevron">›</div>' +
                    '</div>';
            } else {
                list.innerHTML = '<p style="color:#888;font-size:14px;">No account found.</p>';
            }
        }

        function gotoConsent() {
            document.getElementById('step-account').style.display = 'none';
            document.getElementById('step-consent').style.display = 'block';
        }

        function grantAccess() {
            window.location.href = '/api/digilocker/callback?code=mock_code&state=' + state;
        }
    </script>
</body>
</html>
        `;
        res.send(html);
    }

    @Post('mock/send-otp')
    async mockSendOtp(@Body() body: { mobile: string }) {
        const user = await this.usersService.findByMobile(body.mobile);
        if (!user) {
            throw new BadRequestException('Account not found with this mobile number.');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        this.mockOtps.set(body.mobile, otp);

        console.log('--- DIGILOCKER MOCK OTP ---');
        console.log('MOBILE: ' + body.mobile);
        console.log('OTP: ' + otp);
        console.log('---------------------------');

        return { success: true };
    }

    @Post('mock/verify-otp')
    async mockVerifyOtp(@Body() body: { mobile: string; otp: string }) {
        const storedOtp = this.mockOtps.get(body.mobile);
        if (body.otp === storedOtp || body.otp === '123456') {
            const user = await this.usersService.findByMobile(body.mobile);
            if (!user) throw new BadRequestException('Account vanished!');
            return {
                success: true,
                user: { firstName: user.firstName, lastName: user.lastName }
            };
        }
        return { success: false };
    }

    /**
     * Step 2: DigiLocker redirects here after user grants consent.
     * Backend exchanges the authorization code for an access token,
     * then fetches the user's documents from DigiLocker.
     */
    @Get('callback')
    async handleCallback(
        @Query() query: any,
        @Res() res: Response,
    ) {
        const { code, state, error, error_description } = query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        console.log('===== DIGILOCKER CALLBACK START =====');
        console.log('State received:', state ? '✓ Yes' : '✗ No');
        console.log('Code received:', code ? '✓ Yes' : '✗ No');
        console.log('Error from DigiLocker:', error || 'No error');

        if (error) {
            console.log('Redirecting to error page...');
            return res.redirect(frontendUrl + '/document-vault/digilocker?status=error&message=' + encodeURIComponent(error_description || error));
        }
        if (!code || !state) {
            console.log('Missing code or state, redirecting to error');
            return res.redirect(frontendUrl + '/document-vault/digilocker?status=error&message=' + encodeURIComponent('Missing authorization code or state'));
        }

        try {
            const base64 = state
                .replace(/-/g, '+')
                .replace(/_/g, '/')
                .padEnd(Math.ceil(state.length / 4) * 4, '=');
            const decodedState = JSON.parse(Buffer.from(base64, 'base64').toString());
            const { userId, docType, source } = decodedState;
            console.log('✓ State decoded:', { userId, docType, source });
            const redirectPath = source === 'portal' ? '/document-vault/digilocker' : '/document-vault';

            const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
            const redirectUri = process.env.DIGILOCKER_CALLBACK_URL || (backendUrl + '/api/digilocker/callback');
            const mockMode = process.env.DIGILOCKER_MOCK_MODE === 'true';

            console.log('Mode:', mockMode ? 'MOCK' : 'REAL');

            if (mockMode) {
                // Mock mode: simulate document fetch without calling DigiLocker APIs
                console.log('Processing mock documents for userId:', userId);
                await this.processMockDocuments(userId, docType);
                console.log('✓ Mock documents processed');
            } else {
                // Real mode: exchange authorization code for access token (with PKCE code_verifier)
                console.log('Exchanging code for token...');
                const tokenData = await this.digilockerService.getAccessToken(code, redirectUri, decodedState.codeVerifier);
                const accessToken = tokenData.access_token;
                console.log('✓ Access token obtained');

                // Fetch and store documents using the access token
                console.log('Fetching and storing documents...');
                await this.fetchAndStoreDocuments(userId, accessToken, docType);
                console.log('✓ Documents stored');
            }

            console.log('✓ Redirecting to:', redirectPath);
            console.log('===== DIGILOCKER CALLBACK END (SUCCESS) =====');
            return res.redirect(frontendUrl + redirectPath + '?status=success&message=' + encodeURIComponent('Documents fetched from DigiLocker'));
        } catch (error) {
            console.error('❌ DigiLocker callback error:', error);
            const errMsg = error instanceof Error ? error.message : String(error);
            console.log('===== DIGILOCKER CALLBACK END (ERROR) =====');
            return res.redirect(frontendUrl + '/document-vault/digilocker?status=error&message=' + encodeURIComponent('Failed to process DigiLocker response: ' + errMsg));
        }
    }

    private normalizeDigilockerType(rawDoc: any): string {
        // Real DigiLocker API uses 'doctype' field; mock/legacy may use 'type'
        const candidates = [
            rawDoc?.doctype,   // Real API field name
            rawDoc?.type,
            rawDoc?.docType,
            rawDoc?.documentType,
            rawDoc?.issuerDocType,
        ]
            .filter(Boolean)
            .map((value: string) => String(value).toUpperCase().trim());

        if (candidates.length > 0) {
            return candidates[0];
        }

        // Try to extract from URI (e.g., in.gov.cbse-SSCER-1234)
        const uri = String(rawDoc?.uri || rawDoc?.id || '');
        const uriMatch = uri.match(/(PANCR|ADHAR|AADHAR|10TH|12TH|SSCER|HSCER|PASPT|DGCTR|MKST)/i);
        if (uriMatch?.[1]) {
            return uriMatch[1].toUpperCase();
        }

        return '';
    }

    /**
     * Mock document processing for development/testing
     */
    private async processMockDocuments(userId: string, docType: string) {
        console.log('📋 Mock processor started - userId:', userId, 'docType:', docType);

        const mockDocs = [
            { type: 'PANCR', name: 'PAN Card' },
            { type: 'ADHAR', name: 'Aadhar Card' },
            { type: '10TH', name: '10th Marksheet' },
            { type: '12TH', name: '12th Marksheet' },
            { type: 'DGCTR', name: 'B.Tech / Degree Certificate' },
            { type: 'MKST', name: 'Graduation Marksheets' }
        ];

        const syncMap: Record<string, string> = {
            'pan_student': 'PANCR', 'pan_coapp': 'PANCR', 'pan_father': 'PANCR', 'pan_mother': 'PANCR',
            'aadhar_student': 'ADHAR', 'aadhar_coapp': 'ADHAR', 'aadhar_father': 'ADHAR', 'aadhar_mother': 'ADHAR',
            'marksheet_10th': '10TH', 'marksheet_12th': '12TH', 'marksheet_degree': 'DGCTR', 'passport': 'PASPT'
        };

        const reverseMap: Record<string, string[]> = {
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

        if (docType === 'ALL_SYNC') {
            console.log('🔄 Processing ALL documents...');
            for (const diDoc of mockDocs) {
                const internalTypes = reverseMap[diDoc.type] || [];
                console.log(`  - ${diDoc.type} -> ${internalTypes.join(', ')}`);
                for (const type of internalTypes) {
                    await this.usersService.upsertUserDocument(userId, type, {
                        uploaded: false,
                        status: 'available_in_digilocker',
                        digilockerTxId: 'MOCK_TX_' + Date.now(),
                        verificationMetadata: diDoc,
                    });
                    console.log(`    ✓ Upserted ${type} with status available_in_digilocker`);
                }
            }
        } else {
            // Specific doc sync
            console.log('🎯 Processing specific document:', docType);
            const mappedDlType = syncMap[docType] || docType;
            const diDoc = mockDocs.find(d => d.type === mappedDlType) || { type: mappedDlType, name: docType };
            console.log(`  Mapped ${docType} -> ${mappedDlType}`);
            await this.usersService.upsertUserDocument(userId, docType, {
                uploaded: false,
                status: 'available_in_digilocker',
                digilockerTxId: 'MOCK_TX_' + Date.now(),
                verificationMetadata: diDoc,
            });
            console.log(`    ✓ Upserted ${docType} with status available_in_digilocker`);
        }

        console.log('✓ Mock processing complete');
    }

    /**
     * Fetch documents from DigiLocker using access token and store them
     */
    private async fetchAndStoreDocuments(userId: string, accessToken: string, docType: string) {
        console.log('🔍 Fetching documents from DigiLocker...');
        const documents = await this.digilockerService.listDocuments(accessToken);
        console.log(`✓ Retrieved ${documents.length} documents from DigiLocker`);

        const syncMap: Record<string, string> = {
            'pan_student': 'PANCR', 'pan_coapp': 'PANCR', 'pan_father': 'PANCR', 'pan_mother': 'PANCR',
            'aadhar_student': 'ADHAR', 'aadhar_coapp': 'ADHAR', 'aadhar_father': 'ADHAR', 'aadhar_mother': 'ADHAR',
            'marksheet_10th': '10TH', 'marksheet_12th': '12TH', 'marksheet_degree': 'DGCTR', 'passport': 'PASPT'
        };

        const reverseMap: Record<string, string[]> = {
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

        const aliasToCanonical: Record<string, string> = {
            'AADHAR': 'ADHAR',
            'SSC': '10TH',
            'HSC': '12TH',
        };

        let upsertCount = 0;
        for (const doc of documents) {
            const normalizedType = this.normalizeDigilockerType(doc);
            console.log(`  Processing: ${JSON.stringify(doc).substring(0, 100)}... -> normalized: ${normalizedType}`);

            const dlType = aliasToCanonical[normalizedType] || normalizedType;

            if (!dlType) {
                console.log(`    ⚠️  Could not normalize type, skipping`);
                continue;
            }

            if (docType !== 'ALL_SYNC') {
                const mappedDlType = aliasToCanonical[syncMap[docType] || docType] || (syncMap[docType] || docType);
                if (dlType === mappedDlType) {
                    console.log(`    ✓ Matched! Upserting ${docType} (${dlType})`);
                    await this.usersService.upsertUserDocument(userId, docType, {
                        uploaded: false,
                        status: 'available_in_digilocker',
                        digilockerTxId: doc.id || doc.uri || ('DGL_' + Date.now()),
                        verificationMetadata: {
                            source: 'DigiLocker',
                            document_name: doc.name || doc.description,
                            type: dlType,
                            verified_at: new Date().toISOString(),
                        },
                    });
                    upsertCount++;
                } else {
                    console.log(`    ⚠️  Type mismatch: expected ${mappedDlType}, got ${dlType}`);
                }
            } else {
                const internalTypes = reverseMap[dlType] || [];
                console.log(`    ALL_SYNC: ${dlType} -> [${internalTypes.join(', ')}]`);
                for (const type of internalTypes) {
                    await this.usersService.upsertUserDocument(userId, type, {
                        uploaded: false,
                        status: 'available_in_digilocker',
                        digilockerTxId: doc.id || doc.uri || ('DGL_' + Date.now()),
                        verificationMetadata: {
                            source: 'DigiLocker',
                            document_name: doc.name || doc.description,
                            type: dlType,
                            verified_at: new Date().toISOString(),
                        },
                    });
                    console.log(`      ✓ Upserted ${type}`);
                    upsertCount++;
                }
            }
        }

        console.log(`✓ Completed - upserted ${upsertCount} documents`);
    }

    @Post('sync')
    async syncDocument(@Body() body: { userId: string; docType: string }) {
        const { userId, docType } = body;
        const { data: doc, error } = await this.supabase.getClient()
            .from('UserDocument')
            .select('*')
            .eq('userId', userId)
            .eq('docType', docType)
            .single();
        if (!doc) throw new BadRequestException('Document not found');
        await this.usersService.upsertUserDocument(userId, docType, {
            status: 'verified',
            uploaded: true,
            verifiedAt: new Date(),
            filePath: './public/mock/digilocker/' + docType + '.pdf',
            digilockerTxId: doc.digilockerTxId,
            verificationMetadata: doc.verificationMetadata
        });
        return { success: true, message: 'Document synced successfully' };
    }
}

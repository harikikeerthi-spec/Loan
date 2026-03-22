
import { Controller, Get, Post, Body, Query, Res, BadRequestException } from '@nestjs/common';
import { DigilockerService } from './digilocker.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import type { Response } from 'express';
import * as crypto from 'crypto';

@Controller('digilocker')
export class DigilockerController {
    constructor(
        private readonly digilockerService: DigilockerService,
        private readonly usersService: UsersService,
        private readonly prisma: PrismaService,
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
        // Sanitize state to prevent XSS injection in the HTML template
        const safeState = (state || '').replace(/[^a-zA-Z0-9_\-]/g, '');
        // We use string concatenation for the inner template parts to avoid nested backtick escaping issues
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>DigiLocker | Select Account</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
            <style>
                body { font-family: 'Inter', sans-serif; background-color: #f7f9fc; }
                .account-card:hover { border-color: #5e5ce6; background-color: #f0f7ff; }
                .loader { border: 3px solid #f3f3f3; border-top: 3px solid #5e5ce6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        </head>
        <body class="min-h-screen flex flex-col">
            <div class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-4">
                    <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png" class="h-10" alt="DigiLocker">
                    <div class="h-8 w-[1px] bg-gray-200 mx-2"></div>
                    <span class="text-sm font-medium text-gray-500">Government of India</span>
                </div>
            </div>

            <div class="flex-1 flex items-center justify-center p-6">
                <!-- STEP 1 -->
                <div id="step-mobile" class="bg-white w-full max-w-[480px] rounded-3xl shadow-2xl border border-gray-100 p-10">
                    <h1 class="text-2xl font-bold text-gray-800 mb-2">Login or Create Account</h1>
                    <p class="text-gray-500 text-sm mb-10">Enter your mobile number to proceed</p>
                    <div class="space-y-6">
                        <div class="relative">
                            <span class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                            <input type="text" id="phone-input" placeholder="Enter Mobile Number" class="w-full pl-16 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all text-xl font-medium">
                        </div>
                        <div id="error-msg" class="hidden p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 text-center"></div>
                        <button id="mobile-btn" onclick="sendOtp()" class="w-full py-4 bg-[#5e5ce6] text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
                            <span>Continue</span>
                        </button>
                    </div>
                </div>

                <!-- STEP 2 -->
                <div id="step-otp" class="hidden bg-white w-full max-w-[480px] rounded-3xl shadow-2xl border border-gray-100 p-10 text-center">
                    <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                         <span class="material-symbols-outlined text-3xl">sms</span>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-800 mb-2">Verify Mobile</h1>
                    <p class="text-gray-500 text-sm mb-4">Enter the 6-digit OTP sent to <b id="display-phone"></b></p>
                    <div class="mb-10">
                        <input type="text" id="otp-raw" class="w-full py-4 text-center text-3xl font-bold bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 outline-none transition-all" placeholder="000000" maxlength="6">
                    </div>
                    <button id="otp-btn" onclick="verifyOtp()" class="w-full py-4 bg-[#5e5ce6] text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all">Verify & Login</button>
                </div>

                <!-- STEP 3 -->
                <div id="step-account" class="hidden bg-white w-full max-w-[480px] rounded-3xl shadow-2xl border border-gray-100 p-10">
                    <h1 class="text-2xl font-bold text-gray-800 mb-8">Select Account</h1>
                    <div id="account-list" class="space-y-4 mb-10"></div>
                    <button class="w-full py-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-2xl font-bold text-sm hover:border-blue-300 hover:text-blue-600 transition-all">+ Create New Account</button>
                </div>

                <!-- STEP 4 -->
                <div id="step-consent" class="hidden bg-white w-full max-w-[520px] rounded-3xl shadow-2xl border border-gray-100">
                    <div class="bg-blue-50/50 p-8 border-b border-gray-100 flex items-center gap-6">
                        <div class="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 p-4 flex items-center justify-center">
                           <img src="https://ui-avatars.com/api/?name=Vidhya+Loan&background=6605c7&color=fff&bold=true&size=128" alt="VidhyaLoan" class="rounded-xl">
                        </div>
                        <div>
                            <h2 class="text-xl font-extrabold text-gray-900 tracking-tight">Consent Request</h2>
                            <p class="text-gray-500 text-sm">Requested by <b>VidhyaLoan</b></p>
                        </div>
                    </div>
                    <div class="p-10">
                        <p class="text-sm text-gray-600 mb-8 leading-relaxed font-medium">To proceed with your application, VidhyaLoan needs your permission to securely access Identification & Documents.</p>
                        <div class="flex gap-4">
                            <button onclick="window.location.href='/document-vault'" class="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-all">Deny</button>
                            <button onclick="grantAccess()" class="flex-1 py-4 bg-[#004791] text-white rounded-2xl font-bold text-lg hover:bg-blue-900 hover:shadow-xl hover:scale-[1.02] transition-all">Allow Access</button>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                let currentMobile = "";
                const state = "${safeState}";

                async function sendOtp() {
                    const mobile = document.getElementById('phone-input').value;
                    if (!mobile) return alert('Enter mobile number');
                    
                    const btn = document.getElementById('mobile-btn');
                    const errorDiv = document.getElementById('error-msg');
                    
                    currentMobile = mobile;
                    btn.innerHTML = '<div class="loader mx-auto"></div>';
                    btn.disabled = true;
                    errorDiv.classList.add('hidden');
                    
                    try {
                        const response = await fetch('/api/digilocker/mock/send-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ mobile })
                        });
                        
                        const data = await response.json();
                        
                        if (!response.ok) {
                            errorDiv.innerText = data.message || 'Account not found';
                            errorDiv.classList.remove('hidden');
                            return;
                        }
                        
                        document.getElementById('display-phone').innerText = '+91 ' + mobile;
                        document.getElementById('step-mobile').classList.add('hidden');
                        document.getElementById('step-otp').classList.remove('hidden');
                    } catch (e) { 
                        errorDiv.innerText = 'Connection error. Try again.';
                        errorDiv.classList.remove('hidden');
                    }
                    finally { 
                        btn.innerText = 'Continue'; 
                        btn.disabled = false;
                    }
                }

                async function verifyOtp() {
                    const otp = document.getElementById('otp-raw').value;
                    if (!otp) return alert('Enter OTP');
                    try {
                        const res = await fetch('/api/digilocker/mock/verify-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ mobile: currentMobile, otp })
                        });
                        const data = await res.json();
                        if (data.success) {
                            renderAccounts(data.user);
                            document.getElementById('step-otp').classList.add('hidden');
                            document.getElementById('step-account').classList.remove('hidden');
                        } else { alert('Invalid OTP'); }
                    } catch (e) { alert('Error'); }
                }

                function renderAccounts(user) {
                    const list = document.getElementById('account-list');
                    let items = [];
                    
                    // ONLY show account if it exists (Strict Mode)
                    if (user) {
                        items.push(
                            '<div onclick="gotoPermission()" class="account-card flex items-center justify-between p-5 border-2 border-gray-100 rounded-2xl cursor-pointer transition-all">' +
                                '<div class="flex items-center gap-4">' +
                                    '<div class="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl uppercase">' + user.firstName[0] + '</div>' +
                                    '<div>' +
                                        '<p class="font-bold text-gray-900 uppercase">' + user.firstName + ' ' + (user.lastName || "") + '</p>' +
                                        '<p class="text-xs text-green-600 font-medium font-bold">Original DigiLocker Account Found ✅</p>' +
                                    '</div>' +
                                '</div>' +
                                '<span class="material-symbols-outlined text-gray-300">chevron_right</span>' +
                            '</div>'
                        );
                    }
                    
                    list.innerHTML = items.join("");
                }

                function gotoPermission() {
                    document.getElementById('step-account').classList.add('hidden');
                    document.getElementById('step-consent').classList.remove('hidden');
                }
                
                function grantAccess() {
                    window.location.href = "/api/digilocker/callback?code=mock_code&state=" + state;
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
        const candidates = [
            rawDoc?.type,
            rawDoc?.docType,
            rawDoc?.doctype,
            rawDoc?.documentType,
            rawDoc?.issuerDocType,
        ]
            .filter(Boolean)
            .map((value: string) => String(value).toUpperCase().trim());

        if (candidates.length > 0) {
            return candidates[0];
        }

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
        const doc = await this.prisma.userDocument.findUnique({
            where: { userId_docType: { userId, docType } }
        }) as any;
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

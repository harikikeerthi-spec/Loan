
import { Injectable } from '@nestjs/common';

export interface VerificationResult {
    isValid: boolean;
    txId?: string;
    code?: string;
    details?: any;
}

@Injectable()
export class DigilockerService {
    private readonly apiSetuBaseUrl = 'https://api.apisetu.gov.in/v2';
    private readonly authUrl = 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize';
    private readonly tokenUrl = 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/token';
    private readonly fileUrl = 'https://digilocker.meripehchaan.gov.in/public/oauth2/1/files/issued';
    private readonly fileDownloadUrl = 'https://digilocker.meripehchaan.gov.in/public/api/files';
    private readonly clientId = process.env.DIGILOCKER_CLIENT_ID;
    private readonly clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
    private readonly apiSetuKey = process.env.API_SETU_KEY || '';

    constructor() {
        // Disable SSL certificate validation for API Setu in non-production
        if (process.env.NODE_ENV !== 'production') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
    }

    /**
     * Call API Setu to get the official authorization link
     */
    async initiateSession(redirectUri: string): Promise<{ authorization_url: string; txnID: string }> {
        console.log('DIGILOCKER_DEBUG: Initiating session with API Setu...');

        const response = await fetch(`${this.apiSetuBaseUrl}/digilocker/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiSetuKey,
                'x-api-id': this.clientId || ''
            },
            body: JSON.stringify({
                redirectUrl: redirectUri
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('API Setu Session Initiation Failed:', err);
            throw new Error(`API Setu Error: ${err}`);
        }

        return await response.json();
    }

    /**
     * Generate the Authorization URL (Fallback/Legacy)
     */
    getAuthUrl(state: string, redirectUri: string, codeChallenge: string): string {
        return `${this.authUrl}?response_type=code&client_id=${this.clientId || ''}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
    }

    /**
     * Exchange the authorization code for an access token
     */
    async getAccessToken(code: string, redirectUri: string, codeVerifier?: string): Promise<any> {
        console.log('DIGILOCKER_DEBUG: Exchanging code for token.');

        const bodyParams: Record<string, string> = {
            grant_type: 'authorization_code',
            code: code,
            client_id: this.clientId || '',
            client_secret: this.clientSecret || '',
            redirect_uri: redirectUri,
        };

        if (codeVerifier) {
            bodyParams.code_verifier = codeVerifier;
        }

        const body = new URLSearchParams(bodyParams).toString();
        console.log('DIGILOCKER_DEBUG: Token Request Body (masked):', body.replace(this.clientSecret || 'SECRET', '****'));

        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('DIGILOCKER_DEBUG: DigiLocker Token exchange failed:', err);
            throw new Error(`DigiLocker Token Error: ${err}`);
        }

        const data = await response.json();
        console.log('DIGILOCKER_DEBUG: Token exchange success.');
        return data;
    }

    /**
     * Get a list of all issued documents in the user's DigiLocker
     */
    async listDocuments(token: string): Promise<any[]> {
        const response = await fetch(this.fileUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-api-key': this.apiSetuKey,
                'x-api-id': this.clientId || '',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`DigiLocker List Error: ${err}`);
        }

        const data = await response.json();
        return data.items || [];
    }

    /**
     * Download a specific document file from DigiLocker
     */
    async downloadDocument(token: string, uri: string): Promise<Buffer> {
        const response = await fetch(`${this.fileDownloadUrl}/${encodeURIComponent(uri)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/pdf'
            }
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`DigiLocker Download Error: ${err}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    async verifyDocument(token: string, docType: string): Promise<VerificationResult> {
        try {
            const docs = await this.listDocuments(token);

            // Map types to DigiLocker types
            const typeMap: Record<string, string> = {
                'pan_student': 'PANCR',
                'pan_coapp': 'PANCR',
                'pan_father': 'PANCR',
                'pan_mother': 'PANCR',
                'aadhar_student': 'ADHAR',
                'aadhar_coapp': 'ADHAR',
                'aadhar_father': 'ADHAR',
                'aadhar_mother': 'ADHAR',
                'marksheet_10th': '10TH',
                'marksheet_12th': '12TH',
                'passport': 'PASPT',
                'degree_certificate': 'DGCTR',
                'graduation_marksheet': 'MKST',
                'btech_degree': 'DGCTR',
                'intermediate_marksheet': 'HSCER'
            };

            // Add back-mappings to ensure flexibility (e.g. if docType is already DGCTR)
            const fallbackDlType = docType.toUpperCase();
            const alternateDlTypeMap: Record<string, string> = {
                'SSCER': '10TH',
                'HSCER': '12TH',
                'DGCTR': 'DGCTR',
                'MKST': 'MKST'
            };

            const targetDlType = typeMap[docType] || docType.toUpperCase();
            const doc = docs.find((item: any) => item.type === targetDlType);

            if (doc) {
                return {
                    isValid: true,
                    txId: doc.id || 'DGL-' + Math.random().toString(36).substring(7),
                    code: 'VERIFIED_DIGILOCKER',
                    details: {
                        source: 'API Setu / DigiLocker',
                        document_name: doc.name,
                        status: 'Issued',
                        verified_at: new Date().toISOString()
                    }
                };
            }

            return {
                isValid: false,
                code: 'DOC_NOT_FOUND',
                details: { message: `We couldn't find a valid ${docType} in your DigiLocker account.` }
            };
        } catch (error) {
            return {
                isValid: false,
                code: 'VERIFICATION_ERROR',
                details: { message: error.message }
            };
        }
    }
}

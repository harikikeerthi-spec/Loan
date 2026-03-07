
import { Injectable } from '@nestjs/common';

export interface VerificationResult {
    isValid: boolean;
    txId?: string;
    code?: string;
    details?: any;
}

@Injectable()
export class DigilockerService {
    private readonly authUrl = 'https://sandbox.api-setu.in/v2/authorize';
    private readonly tokenUrl = 'https://sandbox.api-setu.in/v2/token';
    private readonly fileUrl = 'https://sandbox.api-setu.in/v2/files/issued';
    private readonly clientId = process.env.DIGILOCKER_CLIENT_ID;
    private readonly clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
    private readonly apiSetuKey = process.env.API_SETU_KEY || '';

    /**
     * Generate the Authorization URL for the student to grant consent
     */
    getAuthUrl(state: string, redirectUri: string): string {
        const scopes = 'openid';
        return `${this.authUrl}?response_type=code&client_id=${this.clientId || ''}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    }

    /**
     * Exchange the authorization code for an access token
     */
    async getAccessToken(code: string, redirectUri: string): Promise<any> {
        console.log('Exchanging code for token. Redirect URI:', redirectUri);
        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                client_id: this.clientId || '',
                client_secret: this.clientSecret || '',
                redirect_uri: redirectUri,
            }).toString(),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('DigiLocker Token exchange failed:', err);
            throw new Error(`DigiLocker Token Error: ${err}`);
        }

        return await response.json();
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
                'passport': 'PASPT'
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

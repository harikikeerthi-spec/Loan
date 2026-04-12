
import { Injectable } from '@nestjs/common';

export interface VerificationResult {
    isValid: boolean;
    txId?: string;
    code?: string;
    details?: any;
}

@Injectable()
export class DigilockerService {
    // DigiLocker Production API base
    private readonly baseUrl = 'https://api.digitallocker.gov.in';
    private readonly authUrl = 'https://api.digitallocker.gov.in/public/oauth2/1/authorize';
    private readonly tokenUrl = 'https://api.digitallocker.gov.in/public/oauth2/1/token';
    // Issued documents endpoint (v2)
    private readonly issuedDocsUrl = 'https://api.digitallocker.gov.in/public/oauth2/2/files/issued';

    private readonly clientId = process.env.DIGILOCKER_CLIENT_ID;
    private readonly clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;

    /**
     * Generate the DigiLocker authorization URL.
     */
    getAuthUrl(state: string, redirectUri: string, codeChallenge: string): string {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId || '',
            redirect_uri: redirectUri,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });
        return `${this.authUrl}?${params.toString()}`;
    }

    /**
     * Exchange the authorization code for an access token
     */
    async getAccessToken(code: string, redirectUri: string, codeVerifier?: string): Promise<any> {
        console.log('DIGILOCKER_DEBUG: Exchanging code for token...');

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
        console.log('DIGILOCKER_DEBUG: Token Request to:', this.tokenUrl);
        console.log('DIGILOCKER_DEBUG: redirect_uri used:', redirectUri);

        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('DIGILOCKER_DEBUG: Token exchange failed:', err);
            throw new Error(`DigiLocker Token Error: ${err}`);
        }

        const data = await response.json();
        console.log('DIGILOCKER_DEBUG: Token exchange success. access_token present:', !!data.access_token);
        return data;
    }

    /**
     * Get the list of issued documents from DigiLocker.
     * Real API response: { items: [{ uri, name, doctype, issuerid, date, description, ... }] }
     */
    async listDocuments(token: string): Promise<any[]> {
        console.log('DIGILOCKER_DEBUG: Fetching issued documents from:', this.issuedDocsUrl);

        const response = await fetch(this.issuedDocsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('DIGILOCKER_DEBUG: Failed to fetch documents:', err);
            throw new Error(`DigiLocker Documents Error: ${err}`);
        }

        const data: any = await response.json();
        console.log('DIGILOCKER_DEBUG: Raw documents response:', JSON.stringify(data, null, 2));

        // Real API returns: { items: [{ uri, name, doctype, issuerid, ... }] }
        const extractArray = (resp: any): any[] => {
            if (Array.isArray(resp)) return resp;
            if (Array.isArray(resp?.items)) return resp.items;
            if (Array.isArray(resp?.documents)) return resp.documents;
            if (Array.isArray(resp?.issued_documents)) return resp.issued_documents;
            if (Array.isArray(resp?.issuedDocuments)) return resp.issuedDocuments;
            if (Array.isArray(resp?.result?.items)) return resp.result.items;
            return [];
        };

        const allDocs = extractArray(data);
        console.log(`DIGILOCKER_DEBUG: Total issued documents: ${allDocs.length}`);
        allDocs.forEach((d, i) => {
            console.log(`  [${i}] doctype="${d.doctype || d.type}" name="${d.name}" uri="${d.uri}"`);
        });
        return allDocs;
    }

    /**
     * Download a specific document file from DigiLocker by URI
     */
    async downloadDocument(token: string, uri: string): Promise<Buffer> {
        const url = `${this.baseUrl}/public/oauth2/1/file/${encodeURIComponent(uri)}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/pdf',
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

            // Map internal doc types to DigiLocker doctype field values
            const typeMap: Record<string, string> = {
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

            const targetDlType = typeMap[docType] || docType.toUpperCase();
            const doc = docs.find((item: any) =>
                (item.doctype || '').toUpperCase() === targetDlType ||
                (item.type || '').toUpperCase() === targetDlType
            );

            if (doc) {
                return {
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
                };
            }

            return {
                isValid: false,
                code: 'DOC_NOT_FOUND',
                details: { message: `Could not find ${docType} in your DigiLocker account.` }
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


import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

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
        console.log('DIGILOCKER_DEBUG: bodyParams:', { ...bodyParams, client_secret: '***' });

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
        const endpoints = [
            'https://api.digitallocker.gov.in/public/oauth2/1/user',
            'https://api.digitallocker.gov.in/public/oauth2/1/profile',
            'https://api.digitallocker.gov.in/public/oauth2/1/xml/adhar',
            'https://api.digitallocker.gov.in/public/oauth2/1/xml/issued',
            'https://api.digitallocker.gov.in/public/oauth2/2/files/issued',
            'https://api.digitallocker.gov.in/public/oauth2/1/files/issued',
            'https://api.digitallocker.gov.in/public/oauth2/2/files/pulled',
            'https://api.digitallocker.gov.in/public/oauth2/1/files/pulled'
        ];

        let allMergedDocs: any[] = [];
        const debugData: any = {};

        for (const url of endpoints) {
            console.log(`DIGILOCKER_DEBUG: Fetching documents from: ${url}`);
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type') || '';
                    let data: any;
                    
                    if (contentType.includes('application/json')) {
                        data = await response.json();
                    } else {
                        const text = await response.text();
                        data = { rawText: text, isXml: text.includes('<?xml') };
                    }
                    
                    debugData[url] = data;
                    
                    const extractArray = (resp: any): any[] => {
                        if (Array.isArray(resp)) return resp;
                        if (Array.isArray(resp?.items)) return resp.items;
                        if (Array.isArray(resp?.documents)) return resp.documents;
                        if (Array.isArray(resp?.issued_documents)) return resp.issued_documents;
                        if (Array.isArray(resp?.issued)) return resp.issued;
                        if (Array.isArray(resp?.pulled)) return resp.pulled;
                        if (Array.isArray(resp?.uploaded)) return resp.uploaded;
                        if (Array.isArray(resp?.result?.items)) return resp.result.items;
                        
                        // Aggressive Aadhaar/Identity detection from profile/user data
                        if (resp?.aadhaar_number || resp?.uid || (resp?.name && (resp?.dob || resp?.gender))) {
                            console.log(`DIGILOCKER_DEBUG: Detected identity/aadhaar data in response at ${url}`);
                            return [{
                                name: resp.aadhaar_number ? 'Aadhaar Card (Linked)' : 'Aadhaar / Identity Profile',
                                doctype: 'ADHAR',
                                uri: resp.uri || 'PROFILE_IDENTITY_' + (resp.aadhaar_number || resp.uid || 'USER'),
                                description: 'Identity data from DigiLocker Profile',
                                ...resp
                            }];
                        }

                        if (resp?.isXml && (resp?.rawText?.includes('UidData') || resp?.rawText?.includes('Certificate') || resp?.rawText?.includes('Aadhaar'))) {
                            const isAadhaar = resp.rawText.includes('UidData') || resp.rawText.includes('Aadhaar');
                            console.log(`DIGILOCKER_DEBUG: Detected ${isAadhaar ? 'Aadhaar' : 'XML'} document in raw text`);
                            return [{
                                name: isAadhaar ? 'Aadhaar Card (Verified XML)' : 'Identity Document (XML)',
                                doctype: isAadhaar ? 'ADHAR' : 'XML_DOC',
                                uri: 'XML_DOC_' + Math.random().toString(36).substring(7),
                                description: 'Fetched via XML API'
                            }];
                        }

                        if (resp?.uri || resp?.doctype || resp?.docType) return [resp];
                        return [];
                    };

                    const docs = extractArray(data);
                    console.log(`DIGILOCKER_DEBUG: Found ${docs.length} documents at ${url}`);
                    allMergedDocs = [...allMergedDocs, ...docs];
                } else {
                    console.error(`DIGILOCKER_DEBUG: Failed at ${url}:`, await response.text());
                }
            } catch (e) {
                console.error(`DIGILOCKER_DEBUG: Error fetching from ${url}:`, e.message);
            }
        }

        // Dump the raw response to a file for debugging
        try {
            fs.writeFileSync('digilocker_debug.json', JSON.stringify({ debugData, allDocs: allMergedDocs }, null, 2));
        } catch (e) {
            console.error('Failed to write debug file', e);
        }

        allMergedDocs.forEach((d, i) => {
            console.log(`  [${i}] doctype="${d.doctype || d.type}" name="${d.name}" uri="${d.uri}"`);
        });
        return allMergedDocs;
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
                'student_pan': 'PANCR',
                'coapp_pan': 'PANCR',
                'father_pan': 'PANCR',
                'mother_pan': 'PANCR',
                'student_aadhar': 'ADHAR',
                'coapp_aadhar': 'ADHAR',
                'father_aadhar': 'ADHAR',
                'mother_aadhar': 'ADHAR',
                'student_10th_marksheet': '10TH',
                'student_12th_marksheet': '12TH',
                'student_passport': 'PASPT',
                'student_degree_marksheet': 'DGCTR',
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

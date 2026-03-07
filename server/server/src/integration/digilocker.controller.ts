
import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import { DigilockerService } from './digilocker.service';
import { UsersService } from '../users/users.service';
import { DocumentVerificationService } from '../ai/services/document-verification.service';
import type { Response } from 'express';

@Controller('digilocker')
export class DigilockerController {
    constructor(
        private readonly digilockerService: DigilockerService,
        private readonly usersService: UsersService,
        private readonly docVerificationService: DocumentVerificationService,
    ) { }

    @Get('callback')
    async handleCallback(
        @Query() query: any,
        @Res() res: Response,
    ) {
        const { code, state, error, error_description } = query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        console.log('DIGILOCKER_DEBUG_V5: Received callback with params:', JSON.stringify(query));

        if (error) {
            console.error('DigiLocker OAuth error:', error, error_description);
            const msg = error_description || error;
            return res.redirect(`${frontendUrl}/document-vault?status=error&message=${encodeURIComponent(msg)}`);
        }

        if (!code || !state) {
            console.error('DIGILOCKER_DEBUG_V5: Missing code or state. Redirecting user back.');
            const msg = "DigiLocker did not return authorization code or state. Please try again or check your client configuration.";
            return res.redirect(`${frontendUrl}/document-vault?status=error&message=${encodeURIComponent(msg)}`);
        }

        try {
            // 1. Decode state
            let decodedState;
            try {
                const base64 = state.replace(/-/g, '+').replace(/_/g, '/');
                decodedState = JSON.parse(Buffer.from(base64, 'base64').toString());
            } catch (e) {
                console.error('DIGILOCKER_DEBUG_V5: State decode error:', e, 'Raw state:', state);
                return res.redirect(`${frontendUrl}/document-vault?status=error&message=Failed%20to%20decode%20session%20data`);
            }

            const { userId, docType, redirectUri: dynamicRedirectUri } = decodedState;
            if (!userId || !docType) {
                throw new Error('State is missing userId or docType');
            }

            // 2. Client-side redirect URI must match exactly what was sent to DigiLocker
            // Note: This must be the SAME URI that was used in initiateDigilockerFlow
            const redirectUri = dynamicRedirectUri || process.env.DIGILOCKER_CALLBACK_URL || 'http://localhost:5000/api/digilocker/callback';

            // 3. Exchange code for token
            const tokenData = await this.digilockerService.getAccessToken(code, redirectUri);
            const accessToken = tokenData.access_token;

            // 4. Process documents
            if (docType === 'ALL_SYNC') {
                const diDocs = await this.digilockerService.listDocuments(accessToken);
                const reverseMap: Record<string, string[]> = {
                    'PANCR': ['pan_student', 'pan_coapp', 'pan_father', 'pan_mother'],
                    'ADHAR': ['aadhar_student', 'aadhar_coapp', 'aadhar_father', 'aadhar_mother'],
                    '10TH': ['marksheet_10th'],
                    '12TH': ['marksheet_12th'],
                    'PASPT': ['passport']
                };

                for (const diDoc of diDocs) {
                    const internalTypes = reverseMap[diDoc.type] || [];
                    for (const type of internalTypes) {
                        await this.usersService.upsertUserDocument(userId, type, {
                            uploaded: true,
                            status: 'verified',
                        });
                    }
                }
            } else {
                const verificationResult = await this.digilockerService.verifyDocument(accessToken, docType);
                let status = 'pending';
                let aiExplanation: string | null = null;

                if (verificationResult.isValid) {
                    status = 'verified';
                } else {
                    status = 'rejected';
                    const reason = verificationResult.details?.message || 'Verification mismatch in DigiLocker central records.';
                    try {
                        aiExplanation = await this.docVerificationService.explainRejection(docType, reason);
                    } catch (e) {
                        console.error('AI Explanation Error:', e);
                    }
                }

                await this.usersService.upsertUserDocument(userId, docType, {
                    uploaded: verificationResult.isValid,
                    status: status
                });
            }

            // 5. Redirect back to frontend dynamically
            // Extract the original frontend URL from our state to handle tunnels/remote IPs
            let baseRedirectUrl = frontendUrl;
            if (dynamicRedirectUri) {
                try {
                    baseRedirectUrl = new URL(dynamicRedirectUri).origin;
                } catch (e) {
                    console.error('DIGILOCKER_DEBUG_V5: Error parsing redirect origin:', e);
                }
            }

            return res.redirect(`${baseRedirectUrl}/document-vault?status=success&message=DigiLocker verification completed`);

        } catch (error) {
            console.error('DigiLocker Callback Error:', error);
            const errorMessage = error.message || 'Unknown error occurred during DigiLocker verification';

            // Try to redirect back using dynamic origin even on error
            let baseRedirectUrl = frontendUrl;
            try {
                const searchParams = new URLSearchParams(query.state); // Backup parse just in case
                // Actually query.state is base64, easier to use what we decoded if available
                // But simplified: extract from query.referer or headers if state fails
                // Let's stick to the decoded variable if possible or fallback.
            } catch (e) { }

            return res.redirect(`${baseRedirectUrl}/document-vault?status=error&message=${encodeURIComponent(errorMessage)}`);
        }
    }
}

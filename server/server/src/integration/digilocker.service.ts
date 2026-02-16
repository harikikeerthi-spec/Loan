
import { Injectable } from '@nestjs/common';

export interface VerificationResult {
    isValid: boolean;
    txId?: string;
    code?: string;
    details?: any;
}

@Injectable()
export class DigilockerService {
    async verifyDocument(filePath: string, docType: string): Promise<VerificationResult> {
        // START MOCK IMPLEMENTATION
        // in a real implementation, this would:
        // 1. Upload the file to Digilocker or send hash
        // 2. Receive verification status

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock Logic:
        // If filename contains 'invalid', 'fail', or 'error', mark as failed.
        // Otherwise success.

        // We don't have the original filename here easily without passing it, 
        // but we can assume the caller passes metadata or we stick to a simple random mock
        // or we just trust most documents for the demo unless specified.

        // Let's rely on a random check for demo diversity if no specific indicator
        // But better to be deterministic for testing.
        // Let's assume if the docType ends with "_TEST_FAIL", it fails.

        const isSuccess = !filePath.toLowerCase().includes('fail');

        if (isSuccess) {
            return {
                isValid: true,
                txId: 'DGL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                code: 'VERIFIED',
                details: {
                    verified_at: new Date().toISOString(),
                    issuer: 'DigiLocker Authority',
                    confidence_score: 0.98
                }
            };
        } else {
            return {
                isValid: false,
                code: 'DOCUMENT_MISMATCH',
                details: {
                    error_code: 'ERR_DATA_MISMATCH',
                    message: 'The document data does not match the records in the central repository.',
                    discrepancy: 'Name mismatch or Document expired.'
                }
            };
        }
        // END MOCK IMPLEMENTATION
    }
}

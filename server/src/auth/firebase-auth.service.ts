import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthService {
  constructor(private configService: ConfigService) {
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

      if (!projectId || !clientEmail || !privateKey) {
        console.warn(
          `[FirebaseAuthService] Firebase credentials missing in env. ` +
          `FIREBASE_PROJECT_ID: ${projectId ? 'PRESENT' : 'MISSING'}, ` +
          `FIREBASE_CLIENT_EMAIL: ${clientEmail ? 'PRESENT' : 'MISSING'}, ` +
          `FIREBASE_PRIVATE_KEY: ${privateKey ? 'PRESENT' : 'MISSING'}. ` +
          `Firebase Authentication will be disabled.`
        );
        return;
      }

      try {
        // Strip surrounding quotes and trim whitespace
        const cleanProjectId = projectId.trim().replace(/^["']|["']$/g, '');
        const cleanClientEmail = clientEmail.trim().replace(/^["']|["']$/g, '');
        const cleanPrivateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: cleanProjectId,
            clientEmail: cleanClientEmail,
            privateKey: cleanPrivateKey,
          }),
        });
        console.log('[FirebaseAuthService] Firebase Admin initialized successfully.');
      } catch (error) {
        console.error('[FirebaseAuthService] Failed to initialize Firebase Admin:', error.message);
      }
    }
  }

  private isEnabled(): boolean {
    return admin.apps.length > 0;
  }

  async verifyToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.isEnabled()) {
      throw new UnauthorizedException('Firebase Authentication is currently disabled (missing server credentials)');
    }
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('[FirebaseAuthService] Token verification failed:', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}

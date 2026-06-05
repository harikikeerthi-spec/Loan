import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

export interface StudentNotificationPayload {
  /** Student's full name (used in message greeting) */
  name: string;
  /** Indian mobile number — digits only, no country code, e.g. "9876543210" */
  mobile: string;
  /** Whether the student has opted in to receive WhatsApp messages */
  whatsapp_consent: boolean;
}

export interface NotificationResult {
  channel: 'whatsapp' | 'sms' | 'mock';
  sid: string;
  status: string;
}

@Injectable()
export class StudentNotificationService {
  private readonly logger = new Logger(StudentNotificationService.name);
  private client: Twilio | null = null;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken && !accountSid.startsWith('your_')) {
      try {
        this.client = new Twilio(accountSid, authToken);
        this.logger.log('Twilio client initialised (live mode).');
      } catch (e) {
        this.logger.warn('Twilio client init failed — mock mode active.');
      }
    } else {
      this.logger.warn('Twilio credentials not set — mock mode active.');
    }
  }

  /**
   * Send a nudge notification to a student.
   *
   * Privacy rule: the body never contains sensitive loan data.
   * The student is directed to log in to the portal to read the actual message.
   *
   * Flow:
   *   whatsapp_consent = true  → try WhatsApp → on failure fall back to SMS
   *   whatsapp_consent = false → SMS directly
   */
  async sendStudentNotification(
    student: StudentNotificationPayload,
  ): Promise<NotificationResult> {
    const { name, mobile, whatsapp_consent } = student;

    // Sanitised body — never expose loan details in the SMS/WA text
    const safeBody =
      `Hi ${name}, you have a new update from VidyaLoans staff. ` +
      `Login to your portal to view and reply.`;

    if (whatsapp_consent) {
      try {
        return await this.sendWhatsApp(mobile, safeBody);
      } catch (err) {
        this.logger.warn(
          `WhatsApp failed for ${mobile}: ${err.message}. Falling back to SMS.`,
        );
        return await this.sendSMS(mobile, safeBody);
      }
    }

    return await this.sendSMS(mobile, safeBody);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async sendWhatsApp(
    mobile: string,
    body: string,
  ): Promise<NotificationResult> {
    const from =
      this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') ||
      'whatsapp:+14155238886';
    const to = `whatsapp:+91${mobile}`;

    if (!this.client) {
      this.logger.log(`[MOCK] WhatsApp → ${to}: ${body}`);
      return { channel: 'mock', sid: `mock_wa_${Date.now()}`, status: 'mocked' };
    }

    const result = await this.client.messages.create({ from, to, body });
    this.logger.log(
      `WhatsApp sent to ${to}. SID: ${result.sid}, Status: ${result.status}`,
    );
    return { channel: 'whatsapp', sid: result.sid, status: result.status };
  }

  private async sendSMS(
    mobile: string,
    body: string,
  ): Promise<NotificationResult> {
    const from = this.configService.get<string>('TWILIO_SMS_NUMBER');
    const to = `+91${mobile}`;

    if (!this.client || !from) {
      this.logger.log(`[MOCK] SMS → ${to}: ${body}`);
      return {
        channel: 'mock',
        sid: `mock_sms_${Date.now()}`,
        status: 'mocked',
      };
    }

    const result = await this.client.messages.create({ from, to, body });
    this.logger.log(`SMS sent to ${to}. SID: ${result.sid}`);
    return { channel: 'sms', sid: result.sid, status: result.status };
  }
}

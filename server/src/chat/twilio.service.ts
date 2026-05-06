import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    
    // Initialize carefully in case keys are mock
    if (accountSid && authToken && accountSid !== 'AC_mock_sid') {
      try {
        this.client = new Twilio(accountSid, authToken);
      } catch (e) {
        this.logger.warn('Failed to initialize real Twilio client. Using mock.');
      }
    }
  }

  async sendWhatsAppMessage(to: string, body: string): Promise<any> {
    const from = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886';
    
    // Format to number (ensure it starts with whatsapp:)
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    if (!this.client) {
      this.logger.log(`[MOCK TWILIO] Sending message to ${formattedTo}: ${body}`);
      return { sid: `mock_sid_${Date.now()}`, status: 'sent' };
    }

    try {
      const message = await this.client.messages.create({
        body,
        from,
        to: formattedTo,
      });
      this.logger.log(`WhatsApp message sent to ${formattedTo}. SID: ${message.sid}`);
      return message;
    } catch (error) {
      if (error.code === 20003) {
        this.logger.warn(`[TWILIO AUTH ERROR] Could not send message to ${formattedTo}. Please check your SID/Token in .env. Simulator will still receive this.`);
      } else {
        this.logger.error(`Failed to send WhatsApp message to ${formattedTo}: ${error.message}`);
      }
      // We throw a specialized error that we can catch in the gateway
      throw error;
    }
  }
}

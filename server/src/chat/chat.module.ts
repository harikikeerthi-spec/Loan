import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TwilioService } from './twilio.service';
import { ChatGateway } from './chat.gateway';
import { WhatsappController } from './whatsapp.controller';
import { ChatController } from './chat.controller';
import { MultiPartyChatService } from './multiparty-chat.service';
import { MultiPartyChatController } from './multiparty-chat.controller';
import { EmailService } from './email.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
      EventEmitterModule,
      UsersModule,
      ConfigModule,
      JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get<string>('JWT_SECRET'),
        }),
        inject: [ConfigService],
      })
  ],
  controllers: [WhatsappController, ChatController, MultiPartyChatController],
  providers: [ChatService, TwilioService, ChatGateway, MultiPartyChatService, EmailService],
  exports: [ChatService, MultiPartyChatService, EmailService]
})
export class ChatModule {}

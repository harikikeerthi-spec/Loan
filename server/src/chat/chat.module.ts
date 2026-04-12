import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TwilioService } from './twilio.service';
import { ChatGateway } from './chat.gateway';
import { WhatsappController } from './whatsapp.controller';
import { ChatController } from './chat.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
      EventEmitterModule,
      UsersModule,
      JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get<string>('JWT_SECRET'),
        }),
        inject: [ConfigService],
      })
  ],
  controllers: [WhatsappController, ChatController],
  providers: [ChatService, TwilioService, ChatGateway],
  exports: [ChatService]
})
export class ChatModule {}

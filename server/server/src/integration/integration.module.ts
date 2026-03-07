
import { Module } from '@nestjs/common';
import { DigilockerService } from './digilocker.service';
import { DigilockerController } from './digilocker.controller';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [UsersModule, AiModule],
    controllers: [DigilockerController],
    providers: [DigilockerService],
    exports: [DigilockerService],
})
export class IntegrationModule { }

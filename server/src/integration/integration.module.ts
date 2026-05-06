
import { Module } from '@nestjs/common';
import { DigilockerService } from './digilocker.service';
import { DigilockerController } from './digilocker.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [DigilockerController],
    providers: [DigilockerService],
    exports: [DigilockerService],
})
export class IntegrationModule { }

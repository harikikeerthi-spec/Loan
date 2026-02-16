
import { Module } from '@nestjs/common';
import { DigilockerService } from './digilocker.service';

@Module({
    providers: [DigilockerService],
    exports: [DigilockerService],
})
export class IntegrationModule { }

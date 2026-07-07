import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { AdminApplicationController } from './admin-application.controller';
import { AdminApplicationService } from './admin-application.service';
import { EvvEngineService } from './evv-engine';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { IntegrationModule } from '../integration/integration.module';
import { DocumentModule } from '../document/document.module';
import { BankModule } from '../bank/bank.module';

@Module({
    imports: [AuthModule, AiModule, IntegrationModule, DocumentModule, BankModule],
    controllers: [ApplicationController, AdminApplicationController],
    providers: [ApplicationService, AdminApplicationService, EvvEngineService],
    exports: [ApplicationService, AdminApplicationService, EvvEngineService],
})
export class ApplicationModule { }

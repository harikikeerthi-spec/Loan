import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { AdminApplicationController } from './admin-application.controller';
import { AdminApplicationService } from './admin-application.service';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
    imports: [AuthModule, AiModule, IntegrationModule],
    controllers: [ApplicationController, AdminApplicationController],
    providers: [ApplicationService, AdminApplicationService],
    exports: [ApplicationService, AdminApplicationService],
})
export class ApplicationModule { }

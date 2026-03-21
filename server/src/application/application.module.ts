import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
    imports: [PrismaModule, AuthModule, AiModule, IntegrationModule],
    controllers: [ApplicationController],
    providers: [ApplicationService],
    exports: [ApplicationService],
})
export class ApplicationModule { }

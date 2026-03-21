
import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { UsersModule } from '../users/users.module';
import { IntegrationModule } from '../integration/integration.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [UsersModule, IntegrationModule, AiModule],
    controllers: [DocumentController],
})
export class DocumentModule { }

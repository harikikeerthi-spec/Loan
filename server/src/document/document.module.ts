
import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { S3Service } from './s3.service';
import { UsersModule } from '../users/users.module';
import { IntegrationModule } from '../integration/integration.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [UsersModule, IntegrationModule, AiModule],
    controllers: [DocumentController],
    providers: [S3Service],
    exports: [S3Service],
})
export class DocumentModule { }

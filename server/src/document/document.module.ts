import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { UsersModule } from '../users/users.module';
import { S3Module } from '../s3/s3.module';

@Module({
    imports: [UsersModule, S3Module],
    controllers: [DocumentController],
})
export class DocumentModule { }

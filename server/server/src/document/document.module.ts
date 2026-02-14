import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [DocumentController],
})
export class DocumentModule { }

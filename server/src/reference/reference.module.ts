import { Module } from '@nestjs/common';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [ReferenceController],
    providers: [ReferenceService],
    exports: [ReferenceService],
})
export class ReferenceModule { }

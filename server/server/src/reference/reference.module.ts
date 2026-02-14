import { Module } from '@nestjs/common';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ReferenceController],
    providers: [ReferenceService],
    exports: [ReferenceService],
})
export class ReferenceModule { }

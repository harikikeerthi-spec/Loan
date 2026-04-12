import { Module } from '@nestjs/common';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';

@Module({
    imports: [],
    controllers: [ReferenceController],
    providers: [ReferenceService],
    exports: [ReferenceService],
})
export class ReferenceModule { }

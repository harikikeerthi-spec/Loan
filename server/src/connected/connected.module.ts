import { Module } from '@nestjs/common';
import { ConnectedController } from './connected.controller';
import { ConnectedService } from './connected.service';

@Module({
    imports: [],
    controllers: [ConnectedController],
    providers: [ConnectedService],
})
export class ConnectedModule { }

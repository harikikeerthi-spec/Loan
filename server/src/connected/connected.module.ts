import { Module } from '@nestjs/common';
import { ConnectedController } from './connected.controller';
import { ConnectedService } from './connected.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ConnectedController],
    providers: [ConnectedService],
})
export class ConnectedModule { }

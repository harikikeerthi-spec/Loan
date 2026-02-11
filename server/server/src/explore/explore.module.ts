import { Module } from '@nestjs/common';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunityModule } from '../community/community.module';
import { ReferenceModule } from '../reference/reference.module';

@Module({
    imports: [PrismaModule, CommunityModule, ReferenceModule],
    controllers: [ExploreController],
    providers: [ExploreService],
})
export class ExploreModule { }

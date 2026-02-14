import { Module } from '@nestjs/common';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunityModule } from '../community/community.module';
import { ReferenceModule } from '../reference/reference.module';

import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, CommunityModule, ReferenceModule, AuthModule],
    controllers: [ExploreController],
    providers: [ExploreService],
})
export class ExploreModule { }

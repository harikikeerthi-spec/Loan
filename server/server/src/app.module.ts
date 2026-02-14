import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { BlogModule } from './blog/blog.module';
import { AiModule } from './ai/ai.module';
import { CommunityModule } from './community/community.module';
import { ApplicationModule } from './application/application.module';
import { DocumentModule } from './document/document.module';
import { ReferenceModule } from './reference/reference.module';
import { ExploreModule } from './explore/explore.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    BlogModule,
    AiModule,
    CommunityModule,
    ApplicationModule,
    DocumentModule,
    ReferenceModule,
    ExploreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { BlogModule } from './blog/blog.module';
import { DocumentModule } from './document/document.module';
import { AiModule } from './ai/ai.module';
import { CommunityModule } from './community/community.module';
import { ReferenceModule } from './reference/reference.module';
import { ApplicationModule } from './application/application.module';
import { ExploreModule } from './explore/explore.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { IntegrationModule } from './integration/integration.module';
import { AuditModule } from './audit/audit.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', '..', '..', 'web'),
        exclude: ['/api/{*path}'],
      },
      {
        rootPath: join(__dirname, '..', 'uploads'),
        serveRoot: '/uploads',
      },
    ),
    PrismaModule,
    AuthModule,
    UsersModule,
    BlogModule,
    DocumentModule,
    AiModule,
    CommunityModule,
    ReferenceModule,
    ApplicationModule,
    ExploreModule,
    OnboardingModule,
    IntegrationModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }


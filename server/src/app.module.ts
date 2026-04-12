import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SupabaseModule } from './supabase/supabase.module';
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
import { ReferralModule } from './referral/referral.module';
import { ConnectedModule } from './connected/connected.module';
import { UniversityModule } from './university/university.module';
import { ChatModule } from './chat/chat.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    SupabaseModule,
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
    ReferralModule,
    ConnectedModule,
    UniversityModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
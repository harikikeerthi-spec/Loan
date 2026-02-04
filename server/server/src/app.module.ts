import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { BlogModule } from './blog/blog.module';
import { DocumentModule } from './document/document.module';
import { AiModule } from './ai/ai.module';


@Module({
  imports: [PrismaModule, AuthModule, UsersModule, BlogModule, DocumentModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

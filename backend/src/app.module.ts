import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './database/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { FinanceModule } from './modules/finance/finance.module';
import { LibraryModule } from './modules/library/library.module';
import { HostelModule } from './modules/hostel/hostel.module';
import { ServicesModule } from './modules/services/services.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ElectionsModule } from './modules/elections/elections.module';
import { AdminModule } from './modules/admin/admin.module';
import { BrandingModule } from './modules/branding/branding.module';
import { RedisModule } from './database/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        ttl: config.get('THROTTLE_TTL', 60) * 1000,
        limit: config.get('THROTTLE_LIMIT', 100),
      }],
    }),
    RedisModule,
    AuthModule,
    StudentsModule,
    AcademicsModule,
    FinanceModule,
    LibraryModule,
    HostelModule,
    ServicesModule,
    NotificationsModule,
    MessagingModule,
    ElectionsModule,
    AdminModule,
    BrandingModule,
  ],
  providers: [
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

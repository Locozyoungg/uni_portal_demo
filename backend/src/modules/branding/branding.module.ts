import { Module } from '@nestjs/common';
import { BrandingService } from './branding.service';
import { BrandingController } from './branding.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [BrandingController],
  providers: [BrandingService, PrismaService],
  exports: [BrandingService],
})
export class BrandingModule {}

import { Module } from '@nestjs/common';
import { HostelService } from './hostel.service';
import { HostelController } from './hostel.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [HostelController],
  providers: [HostelService, PrismaService],
  exports: [HostelService],
})
export class HostelModule {}

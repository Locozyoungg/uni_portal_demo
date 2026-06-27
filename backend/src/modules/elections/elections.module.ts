import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { IntegrationController } from './integration.controller';
import { ElectionsFactory } from './elections.factory';
import { MockStrategy } from './strategies/mock.strategy';
import { IframeStrategy } from './strategies/iframe.strategy';
import { SdkStrategy } from './strategies/sdk.strategy';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [ElectionsController, IntegrationController],
  providers: [
    ElectionsService,
    ElectionsFactory,
    MockStrategy,
    IframeStrategy,
    SdkStrategy,
    PrismaService,
  ],
  exports: [ElectionsService],
})
export class ElectionsModule {}

import { Injectable } from '@nestjs/common';
import { ElectionStrategy } from './strategies/election-strategy.interface';
import { MockStrategy } from './strategies/mock.strategy';
import { IframeStrategy } from './strategies/iframe.strategy';
import { SdkStrategy } from './strategies/sdk.strategy';

export type IntegrationMode = 'mock' | 'iframe' | 'sdk';

@Injectable()
export class ElectionsFactory {
  constructor(
    private mockStrategy: MockStrategy,
    private iframeStrategy: IframeStrategy,
    private sdkStrategy: SdkStrategy,
  ) {}

  getStrategy(mode?: IntegrationMode): ElectionStrategy {
    const integrationMode = mode || this.resolveMode();

    switch (integrationMode) {
      case 'iframe':
        return this.iframeStrategy;
      case 'sdk':
        return this.sdkStrategy;
      case 'mock':
      default:
        return this.mockStrategy;
    }
  }

  resolveMode(): IntegrationMode {
    const envMode = process.env.UNIELECTION_INTEGRATION_MODE || 'mock';
    const normalized = envMode.toLowerCase() as IntegrationMode;

    if (['mock', 'iframe', 'sdk'].includes(normalized)) {
      return normalized;
    }

    return 'mock';
  }
}

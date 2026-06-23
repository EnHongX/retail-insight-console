import { Module } from '@nestjs/common';
import { MetricsEngine } from './metrics.engine';

@Module({
  providers: [MetricsEngine],
  exports: [MetricsEngine],
})
export class MetricsModule {}

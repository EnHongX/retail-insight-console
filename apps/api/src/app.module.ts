import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

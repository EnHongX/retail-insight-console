import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard/summary')
  getSummary(@Query('period') period?: string) {
    return this.dashboardService.getSummary(period);
  }

  @Get('dashboard/sales-trend')
  getSalesTrend(@Query('period') period?: string) {
    return this.dashboardService.getSalesTrend(period);
  }

  @Get('products/top-selling')
  getTopProducts(
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getTopProducts(period, limit);
  }

  @Get('refunds/summary')
  getRefundSummary(@Query('period') period?: string) {
    return this.dashboardService.getRefundSummary(period);
  }
}

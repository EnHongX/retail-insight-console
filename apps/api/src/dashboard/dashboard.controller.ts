import { Controller, Get, Query } from '@nestjs/common';
import { type DashboardFilters, DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard/filters')
  getFilters() {
    return this.dashboardService.getFilterOptions();
  }

  @Get('dashboard/summary')
  getSummary(@Query() filters: DashboardFilters) {
    return this.dashboardService.getSummary(filters);
  }

  @Get('dashboard/sales-trend')
  getSalesTrend(@Query() filters: DashboardFilters) {
    return this.dashboardService.getSalesTrend(filters);
  }

  @Get('products/top-selling')
  getTopProducts(
    @Query() filters: DashboardFilters,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getTopProducts(filters, limit);
  }

  @Get('refunds/summary')
  getRefundSummary(@Query() filters: DashboardFilters) {
    return this.dashboardService.getRefundSummary(filters);
  }
}

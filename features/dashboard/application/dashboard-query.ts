import type { DashboardViewModel } from "@/features/dashboard/domain/dashboard-view-model";

export interface DashboardQuery {
  getOverview(): Promise<DashboardViewModel>;
}

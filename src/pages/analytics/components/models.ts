import { DashboardTeamRankingMetric } from "@/api/repositories/ApiRepository";

export type QualityChartMonth = {
  key: string;
  label: string;
  color: string;
};

export type QualityByServiceData = {
  period: string[];
  services: Array<{
    serviceKey: string;
    serviceLabel: string;
    series: Array<{
      month: string;
      inspectionsCount: number;
      qualityPercent: number;
    }>;
    growth: {
      fromMonth: string;
      toMonth: string;
      growthPercent: number;
      deltaPoints: number;
    } | null;
  }>;
};

export type CurrentMonthByServiceData = {
  month: string;
  summary: {
    averagePercent: number;
    inspectionsCount: number;
    pendingAdjustmentsCount: number;
  };
  services: Array<{
    serviceKey: string;
    serviceLabel: string;
    inspectionsCount: number;
    qualityPercent: number;
  }>;
};

export type TeamPerformanceFilters = {
  teamIds: string[];
};

export type TeamOption = {
  id: string;
  name: string;
};

export type TeamPerformanceData = {
  summary: {
    averagePercent: number;
    previousAveragePercent: number;
    inspectionsCount: number;
    pendingAdjustmentsCount: number;
  };
};

export type TeamPerformanceRow = {
  teamId: string;
  teamName: string;
  averagePercent: number;
  inspectionsCount: number;
};

export type TeamRankingQualityRow = {
  teamId: string;
  teamName: string;
  averagePercent: number;
  inspectionsCount: number;
  pendingCount: number;
  fieldPercent: number;
  remotePercent: number;
  postWorkPercent: number;
  investmentWorksPercent: number;
};

export type TeamRankingOrderBy = "average" | "field" | "remote" | "postWork";

export type TeamRankingInspectionItem = {
  inspectionId: string;
  serviceOrderId: string;
  serviceOrderNumber: string;
  serviceOrderAddress: string | null;
  module: string;
  status: string;
  scorePercent: number;
  finishedAt: string | null;
  createdAt: string;
};

export type TeamRankingInspectionsMeta = {
  teamId: string;
  teamName: string;
  metric: DashboardTeamRankingMetric;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

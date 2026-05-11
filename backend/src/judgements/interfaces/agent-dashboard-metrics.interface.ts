export interface AgentDashboardMetrics {
  agentMetrics: {
    avgInputTokens: number | null;
    avgLatencyMs: number | null;
    avgSuccessRate: number | null;
    totalNumberOfCalls: number | null;
  };
  judgementMetrics: {
    avgAccuracy: number | null;
    avgRelevance: number | null;
    avgReasoningQuality: number | null;
    avgHallucination: number | null;
  };
  successChart: WeeklyChartItem[];
}

interface WeeklyChartItem {
  timestamp: Date;
  success: boolean;
  // week: string; // 'YYYY-MM-DD'
  // success: number;
  // failure: number;
}

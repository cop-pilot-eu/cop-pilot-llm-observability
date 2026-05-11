declare global {
  type Judgement = {
    id: string;
    status: "PENDING" | "FAILED" | "COMPLETED";
  };

  type AgentEvent = {
    id: string;
    timestamp: string;
    agentId: string;
    inputPrompt: string;
    responseText: string;
  };

  type AgentEventHistory = {
    conversationId: string;
    judgement: Judgement;
    events: AgentEvent[];
  };

  type AgentMetrics = {
    totalNumberOfCalls: number | null;
    avgInputTokens: number | null;
    avgLatencyMs: number | null;
    avgSuccessRate: number | null;
  };

  type JudgementMetrics = {
    avgAccuracy: number | null;
    avgRelevance: number | null;
    avgReasoningQuality: number | null;
    avgHallucination: number | null;
  };

  type SuccessChartData = {
    timestamp: string;
    success: boolean;
  };

  type AgentEventsResponse = {
    events: Record<string, AgentEvent[]>;
    metrics: {
      agentMetrics: AgentMetrics;
      judgementMetrics: JudgementMetrics;
      successChart: SuccessChartData[];
    };
  };
}

declare global {
  type JudgementResultData = {
    accuracy: number | null;
    relevance: number | null;
    reasoningQuality: number | null;
    hallucination: boolean | null;
    output: string;
    response: string | null;
    reasoning: string | null;
    userVote: boolean | null;
    averageLatencyMs: number | null;
  };

  type JudgementResponse = {
    status: "PENDING" | "COMPLETED" | "FAILED";
    data?: JudgementResultData;
    message?: string;
  };
}

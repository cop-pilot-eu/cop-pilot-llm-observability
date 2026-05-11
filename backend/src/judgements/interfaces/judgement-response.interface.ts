import { Judgement, JudgementStatus } from '../entities/judgement.entity';

export interface JudgementResponse {
  status: JudgementStatus;
  data?: Omit<
    Judgement,
    | 'id'
    | 'conversation'
    | 'conversationId'
    | 'createdAt'
    | 'updatedAt'
    | 'agentEventId'
    | 'status'
  > & {
    averageLatencyMs: number;
  };
  message: string;
}

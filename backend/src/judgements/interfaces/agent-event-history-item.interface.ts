import { JudgementStatus } from '../entities/judgement.entity';

interface AgentEventItem {
  id: string;
  agentId: string;
  inputPrompt: string;
  responseText: string;
  timestamp: Date;
}

export interface AgentEventHistoryItem {
  conversationId: string;
  judgement: {
    id: string;
    status: JudgementStatus;
  };
  events: AgentEventItem[];
}

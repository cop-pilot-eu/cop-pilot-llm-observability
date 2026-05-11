import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('agent_events')
@Index(['agentId'])
export class AgentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'timestamptz',
    name: 'event_timestamp',
  })
  timestamp: Date;

  @Column({ name: 'agent_id' })
  agentId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.agentEvents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column()
  model: string;

  @Column()
  provider: string;

  @Column({ name: 'input_tokens', type: 'int' })
  inputTokens: number;

  @Column({ name: 'completion_tokens', type: 'int' })
  completionTokens: number;

  @Column({ name: 'max_tokens', type: 'int' })
  maxTokens: number;

  @Column({ name: 'latency_ms', type: 'int' })
  latencyMs: number;

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({ name: 'input_prompt', type: 'text' })
  inputPrompt: string;

  @Column({ name: 'response_text', type: 'text' })
  responseText: string;

  @Column({ name: 'reasoning_steps', type: 'jsonb', nullable: true })
  reasoningSteps: string[] | null;

  @Column({ name: 'mcp_tool_selected', nullable: true })
  mcpToolSelected: string | null;

  @Column({ name: 'tool_selection_reasoning', type: 'text', nullable: true })
  toolSelectionReasoning: string | null;

  @Column({ name: 'tool_selection_confidence', type: 'jsonb', nullable: true })
  toolSelectionConfidence: Record<string, number> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

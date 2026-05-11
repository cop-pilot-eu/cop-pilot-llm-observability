import { Conversation } from 'src/agent-events/entities/conversation.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JudgementStatus {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
}

@Entity('judgements')
export class Judgement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Conversation, (conversation) => conversation.judgement)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({
    name: 'conversation_id',
    type: 'uuid',
    unique: true,
    nullable: false,
  })
  conversationId: string;

  @Column({ type: 'jsonb', nullable: true })
  response: string;

  @Column({ type: 'text', nullable: true })
  output: string;

  @Column({ type: 'int', nullable: true })
  accuracy: number;

  @Column({ type: 'int', nullable: true })
  relevance: number;

  @Column({ type: 'int', name: 'reasoning_quality', nullable: true })
  reasoningQuality: number;

  @Column({ nullable: true })
  hallucination: boolean;

  @Column({ type: 'text', nullable: true })
  reasoning: string;

  @Column({
    type: 'enum',
    enum: JudgementStatus,
    default: JudgementStatus.PENDING,
  })
  status: JudgementStatus;

  @Column({ nullable: true, name: 'user_vote' })
  userVote: boolean | null;

  @Column({ name: 'latency_ms', type: 'float', nullable: true })
  latencyMs: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

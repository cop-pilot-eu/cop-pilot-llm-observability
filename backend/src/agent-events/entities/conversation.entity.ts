import { AgentEvent } from 'src/agent-events/entities/agent-event.entity';
import { Judgement } from 'src/judgements/entities/judgement.entity';
import {
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => AgentEvent, (event) => event.conversation)
  agentEvents: AgentEvent[];

  @OneToOne(() => Judgement, (judgement) => judgement.conversation)
  judgement: Judgement;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

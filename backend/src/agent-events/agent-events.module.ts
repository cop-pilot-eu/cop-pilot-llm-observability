import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JudgementsModule } from 'src/judgements/judgements.module';
import { AgentEventsController } from './agent-events.controller';
import { AgentEventsService } from './agent-events.service';
import { AgentEvent } from './entities/agent-event.entity';
import { Conversation } from './entities/conversation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentEvent, Conversation]),
    JudgementsModule,
  ],
  controllers: [AgentEventsController],
  providers: [AgentEventsService],
})
export class AgentEventsModule {}

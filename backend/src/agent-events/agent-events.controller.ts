import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Judgement } from 'src/judgements/entities/judgement.entity';
import { AgentEventsService } from './agent-events.service';
import { CreateAgentEventDto } from './dto/create-agent-event.dto';
import { Conversation } from './entities/conversation.entity';

/**
 * Controller for managing agent events.
 * Exposes endpoints for ingesting new agent events and retrieving agent summaries.
 */
@Controller('agent-events')
export class AgentEventsController {
  constructor(private readonly agentEventsService: AgentEventsService) {}

  /**
   * Ingests a new agent event and triggers an asynchronous LLM evaluation.
   * @param agentEvent - The agent event payload to persist.
   * @returns The persisted agent event alongside its newly created pending judgement.
   */
  @Post()
  handleIncomingAgentEvent(
    @Body() agentEvent: CreateAgentEventDto,
  ): Promise<{ conversation: Conversation; judgement: Judgement }> {
    return this.agentEventsService.handleIncomingAgentEvent(agentEvent);
  }

  /**
   * Retrieves the dashboard summary for a specific agent, including metrics and event history.
   * @param agentId - The unique identifier of the agent.
   * @returns An object containing grouped event history and aggregated dashboard metrics.
   * @throws NotFoundException if no events exist for the given agent ID.
   */
  @Get('agent/:id')
  getAgentEvents(@Param('id') agentId: string) {
    return this.agentEventsService.getAgentSummary(agentId);
  }

  /**
   * Retrieves the list of all distinct agent IDs that have recorded events.
   * @returns An object containing an array of agent ID strings.
   */
  @Get('agents')
  getAgentIds() {
    return this.agentEventsService.getAgentIds();
  }
}

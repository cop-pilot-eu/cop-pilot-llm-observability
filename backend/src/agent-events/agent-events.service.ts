import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Judgement } from 'src/judgements/entities/judgement.entity';
import { AgentDashboardMetrics } from 'src/judgements/interfaces/agent-dashboard-metrics.interface';
import { AgentEventHistoryItem } from 'src/judgements/interfaces/agent-event-history-item.interface';
import { JudgementsService } from 'src/judgements/judgements.service';
import { Repository } from 'typeorm';
import { CreateAgentEventDto } from './dto/create-agent-event.dto';
import { AgentEvent } from './entities/agent-event.entity';
import { Conversation } from './entities/conversation.entity';

/**
 * Service responsible for persisting agent events and orchestrating LLM evaluations.
 */
@Injectable()
export class AgentEventsService {
  private readonly logger = new Logger(AgentEventsService.name);

  constructor(
    @InjectRepository(AgentEvent)
    private readonly agentEventRepo: Repository<AgentEvent>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    private readonly judgementsService: JudgementsService,
  ) {}

  /**
   * Persists a new agent event, creates a pending judgement, and fires off an
   * asynchronous LLM evaluation without blocking the response.
   * @param agentEvent - The raw agent event data to store.
   * @returns The persisted event together with its newly created pending judgement.
   */
  async handleIncomingAgentEvent(
    agentEvent: CreateAgentEventDto,
  ): Promise<{ conversation: Conversation; judgement: Judgement }> {
    this.logger.log(`Saving agent event for agent '${agentEvent.agentId}'`);

    const conversation = await this.conversationRepo.findOne({
      where: { id: agentEvent.conversationId },
    });
    if (!conversation)
      await this.conversationRepo.save({ id: agentEvent.conversationId });

    const savedEvent = await this.agentEventRepo.save(agentEvent);

    const savedConversation = await this.conversationRepo.findOne({
      where: { id: agentEvent.conversationId },
      relations: ['agentEvents'],
    });

    this.logger.log(`Agent event '${savedEvent.id}' saved, creating judgement`);
    const savedJudgement: Judgement =
      await this.judgementsService.createJudgement(savedConversation.id);

    this.logger.log(
      `Triggering async LLM evaluation for judgement '${savedJudgement.id}'`,
    );
    this.judgementsService.executeLLMEvaluation(
      savedJudgement,
      savedConversation,
    );
    return { conversation: savedConversation, judgement: savedJudgement };
  }

  /**
   * Builds the full dashboard summary for a given agent: aggregated metrics and
   * the event history grouped by agent ID.
   * @param agentId - The unique identifier of the agent.
   * @returns An object with `events` and `metrics` (dashboard KPIs).
   * @throws NotFoundException if no events are found for the given agent ID.
   */
  async getAgentSummary(agentId: string): Promise<{
    events: AgentEventHistoryItem[];
    metrics: AgentDashboardMetrics;
  }> {
    this.logger.log(`Fetching summary for agent '${agentId}'`);
    const agent = await this.agentEventRepo.findOne({
      where: {
        agentId,
      },
    });

    if (!agent) {
      this.logger.warn(`No events found for agent '${agentId}'`);
      throw new NotFoundException(`Events for agent '${agentId}' not found`);
    }
    const [metrics, events] = await Promise.all([
      this.getAgentDashboardMetrics(agentId),
      this.getAgentEventHistory(agentId),
    ]);

    this.logger.log(
      `Summary built for agent '${agentId}' with ${events.length} events`,
    );
    return {
      events,
      metrics,
    };
  }

  /**
   * Returns all distinct agent IDs that have at least one recorded event.
   * @returns An object containing an `agentIds` array of unique agent ID strings.
   */
  async getAgentIds(): Promise<{ agentIds: string[] }> {
    this.logger.log('Fetching all distinct agent IDs');
    const agentIds = await this.agentEventRepo
      .createQueryBuilder()
      .distinct()
      .select('agent_id as "agentId"')
      .getRawMany();

    this.logger.log(`Found ${agentIds.length} distinct agent(s)`);
    return { agentIds: agentIds.map(({ agentId }) => agentId) };
  }

  /**
   * Fetches a lightweight event history for the given agent, including each
   * event's prompt, response text, timestamp, and associated judgement status.
   * @param agentId - The unique identifier of the agent.
   * @returns An array of `AgentEventHistoryItem` objects.
   */
  private async getAgentEventHistory(
    agentId: string,
  ): Promise<AgentEventHistoryItem[]> {
    const agentEvents = await this.agentEventRepo.find({
      relations: ['conversation', 'conversation.judgement'],
      select: {
        id: true,
        inputPrompt: true,
        responseText: true,
        agentId: true,
        timestamp: true,
        conversation: {
          id: true,
          judgement: {
            id: true,
            status: true,
          },
        },
      },
      where: { agentId, success: true },
      order: { timestamp: 'DESC' },
    });

    const grouped = new Map<string, AgentEventHistoryItem>();

    for (const { conversation, ...event } of agentEvents) {
      const existing = grouped.get(conversation.id);

      if (existing) existing.events.push(event);
      else
        grouped.set(conversation.id, {
          conversationId: conversation.id,
          judgement: conversation.judgement,
          events: [event],
        });
    }

    return [...grouped.values()];
  }

  /**
   * Computes aggregated dashboard metrics for a given agent by querying
   * both the agent events and their related judgements.
   * Metrics are calculated using the agent-reported `event_timestamp`, not the DB `created_at`.
   * @param agentId - The unique identifier of the agent.
   * @returns An `AgentDashboardMetrics` object with `agentMetrics`, `judgementMetrics`, and `successChart`.
   */
  private async getAgentDashboardMetrics(
    agentId: string,
  ): Promise<AgentDashboardMetrics> {
    // INFO: Calculations are made by event_timestamp column (field that is sent by agent) and not pg's created_at

    const [raw, successRaw] = await Promise.all([
      // dashboard metrics for agent events and judgements
      this.agentEventRepo
        .createQueryBuilder('ae')
        .leftJoin('ae.conversation', 'c')
        .leftJoin('c.judgement', 'j')
        .select([
          'round(avg(ae.input_tokens + ae.completion_tokens), 2) as "avgInputTokens"',
          'round(avg(ae.latency_ms), 2) as "avgLatencyMs"',
          'round(avg(ae.success::int), 2) as "avgSuccessRate"',
          'count(ae.id) as "totalNumberOfCalls"',

          // INFO dummy llm only generates float numbers from 0 to 5
          'round(avg(j.accuracy), 2) as "avgAccuracy"',
          'round(avg(j.relevance), 2) as "avgRelevance"',
          'round(avg(j.reasoning_quality), 2) as "avgReasoningQuality"',
          'round(avg(j.hallucination::int), 2) as "avgHallucination"',
        ])
        .where('ae.agent_id = :agentId', { agentId })
        .getRawOne(),
      this.agentEventRepo.find({
        select: { timestamp: true, success: true },
        where: { agentId },
      }),
    ]);

    const num = (val: any) => (val ? Number(val) : val); // keep nulls intact

    return {
      agentMetrics: {
        avgInputTokens: num(raw.avgInputTokens),
        avgLatencyMs: num(raw.avgLatencyMs),
        avgSuccessRate: num(raw.avgSuccessRate),
        totalNumberOfCalls: num(raw.totalNumberOfCalls),
      },
      judgementMetrics: {
        avgAccuracy: num(raw.avgAccuracy),
        avgRelevance: num(raw.avgRelevance),
        avgReasoningQuality: num(raw.avgReasoningQuality),
        avgHallucination: num(raw.avgHallucination),
      },
      successChart: successRaw,
    };
  }
}

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from 'src/agent-events/entities/conversation.entity';
import { Repository } from 'typeorm';
import { UpdateJudgementVoteDto } from './dto/update-judgement-vote.dto';
import { Judgement, JudgementStatus } from './entities/judgement.entity';
import { JudgementResponse } from './interfaces/judgement-response.interface';

/**
 * Service responsible for creating judgements, running LLM-as-a-judge evaluations,
 * and handling user votes on evaluation results.
 */
@Injectable()
export class JudgementsService {
  private readonly logger = new Logger(JudgementsService.name);

  constructor(
    @InjectRepository(Judgement)
    private readonly judgementRepo: Repository<Judgement>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Creates a new judgement record in `PENDING` status for the given conversation id.
   * @param agentEvent - The persisted agent event to evaluate.
   * @returns The newly created `Judgement` entity.
   */
  async createJudgement(conversationId: string): Promise<Judgement> {
    const judgement = await this.judgementRepo.findOne({
      where: { conversationId },
    });
    if (judgement) await this.judgementRepo.delete(judgement.id);

    this.logger.log(`Creating judgement for conversation '${conversationId}'`);
    const newJudgement = this.judgementRepo.create({
      conversationId,
      status: JudgementStatus.PENDING,
    });
    const saved = await this.judgementRepo.save(newJudgement);
    this.logger.log(`Judgement '${saved.id}' created with status PENDING`);
    return saved;
  }

  /**
   * Calls the LLM judge, then updates the judgement with the evaluation scores.
   * On failure, marks the judgement as `FAILED` and logs the error.
   * @param judgementId - The UUID of the judgement to update.
   * @param eventData - The agent event data passed to the LLM for evaluation.
   * @returns The updated `Judgement` entity after the evaluation completes or fails.
   */
  async executeLLMEvaluation(
    judgement: Judgement,
    conversation: Conversation,
  ): Promise<Judgement> {
    this.logger.log(`Starting LLM evaluation for judgement '${judgement.id}'`);
    try {
      if (judgement.status !== JudgementStatus.PENDING)
        await this.judgementRepo.update(judgement.id, {
          status: JudgementStatus.PENDING,
        });
      const llmResult = await this.callLLM(conversation);
      this.logger.log(
        `LLM evaluation completed for judgement '${judgement.id}'`,
      );

      this.judgementRepo.merge(judgement, {
        status: JudgementStatus.COMPLETED,
        accuracy: llmResult.accuracy,
        relevance: llmResult.relevance,
        output: llmResult.output,
        reasoningQuality: llmResult.reasoningQuality,
        hallucination: llmResult.hallucination,
        latencyMs: llmResult.latencyMs,
      });
      return this.judgementRepo.save(judgement);
    } catch (error) {
      this.logger.error('LLM Error:', error);
      this.judgementRepo.merge(judgement, { status: JudgementStatus.FAILED });
      return this.judgementRepo.save(judgement);
    }
  }

  /**
   * Returns the current status or final evaluation result of a judgement.
   * - `COMPLETED`: returns full scores, output, and the agent's average LLM latency.
   * - `PENDING`: returns a retry message while the evaluation is in progress.
   * - `FAILED`: re-triggers `executeLLMEvaluation` and returns a pending status.
   * @param judgementId - The UUID of the judgement to retrieve.
   * @returns A `JudgementResponse` with status, optional data, and a human-readable message.
   * @throws NotFoundException if no judgement exists for the given UUID.
   */
  async getJudgementStatusOrResult(
    judgementId: string,
  ): Promise<JudgementResponse> {
    this.logger.log(`Fetching judgement '${judgementId}'`);
    const judgement = await this.judgementRepo.findOne({
      where: {
        id: judgementId,
      },
      relations: ['conversation', 'conversation.agentEvents'],
    });

    if (!judgement) {
      this.logger.warn(`Judgement '${judgementId}' not found`);
      throw new NotFoundException('Judgement not found');
    }

    this.logger.log(
      `Judgement '${judgementId}' has status '${judgement.status}'`,
    );
    switch (judgement.status) {
      case JudgementStatus.COMPLETED: {
        const agentId = judgement.conversation.agentEvents[0]?.agentId;
        const { averageLatency } = await this.judgementRepo
          .createQueryBuilder('j')
          .innerJoin('j.conversation', 'c')
          .innerJoin('c.agentEvents', 'ae')
          .select('round(avg(j.latency_ms)::numeric, 2)', 'averageLatency')
          .where('ae.agent_id = :agentId', { agentId })
          .getRawOne();

        return {
          status: judgement.status,
          data: {
            response: judgement.response,
            output: judgement.output,
            accuracy: judgement.accuracy,
            relevance: judgement.relevance,
            reasoningQuality: judgement.reasoningQuality,
            hallucination: judgement.hallucination,
            reasoning: judgement.reasoning,
            userVote: judgement.userVote,
            latencyMs: judgement.latencyMs,
            averageLatencyMs: parseFloat(averageLatency),
          },
          message: 'Judgement completed',
        };
      }
      case JudgementStatus.PENDING:
        return {
          status: judgement.status,
          message:
            'LLM is working to evaluate this event. Please try again later.',
        };
      case JudgementStatus.FAILED:
        this.logger.warn(
          `Judgement '${judgementId}' failed — re-triggering LLM evaluation`,
        );
        void this.executeLLMEvaluation(judgement, judgement.conversation);
        return {
          status: JudgementStatus.PENDING,
          message:
            'Evaluation failed. Iniatiating new evaluation. Please try again later.',
        };
      default:
        throw new Error(`Unhandled judgement status: ${judgement.status}`);
    }
  }

  /**
   * Persists a user's like/dislike vote on a judgement.
   * @param judgementId - The UUID of the judgement to vote on.
   * @param updateJudgementVoteDto - DTO containing `isLike` (boolean) representing the vote.
   */
  async updateJudgementVote(
    judgementId: string,
    updateJudgementVoteDto: UpdateJudgementVoteDto,
  ): Promise<void> {
    this.logger.log(
      `Recording vote for judgement '${judgementId}': isLike=${updateJudgementVoteDto.isLike}`,
    );
    await this.judgementRepo.update(judgementId, {
      userVote: updateJudgementVoteDto.isLike,
    });
  }

  private async callLLM(
    conversation: Conversation,
  ): Promise<
    Pick<
      Judgement,
      | 'accuracy'
      | 'relevance'
      | 'reasoningQuality'
      | 'hallucination'
      | 'output'
      | 'latencyMs'
    >
  > {
    return (
      await this.httpService.axiosRef.post(
        `${process.env.DATA_ANALYTICS_URL}/call-llm`,
        {
          conversationId: conversation.id,
          conversationHistory: conversation.agentEvents.map((agentEvent) => ({
            success: agentEvent.success,
            inputPrompt: agentEvent.inputPrompt,
            responseText: agentEvent.responseText,
            reasoning: agentEvent.reasoningSteps?.join(','),
            mcpToolSelected: agentEvent.mcpToolSelected,
            toolSelectionReasoning: agentEvent.toolSelectionReasoning,
          })),
        },
      )
    ).data;
  }
}

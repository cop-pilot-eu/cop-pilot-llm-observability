import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { UpdateJudgementVoteDto } from './dto/update-judgement-vote.dto';
import { JudgementResponse } from './interfaces/judgement-response.interface';
import { JudgementsService } from './judgements.service';

/**
 * Controller for managing LLM judgements.
 * Exposes endpoints for polling judgement results and submitting user votes.
 */
@Controller('judgements')
export class JudgementsController {
  constructor(private readonly judgementsService: JudgementsService) {}

  /**
   * Retrieves the current status or final result of a judgement.
   * - `COMPLETED`: returns the full evaluation scores and output.
   * - `PENDING`: returns a message indicating the LLM evaluation is still in progress.
   * - `FAILED`: re-triggers the LLM evaluation and returns a pending status.
   * @param judgementId - The UUID of the judgement to look up.
   * @returns A `JudgementResponse` describing the current status and, if completed, the evaluation data.
   * @throws NotFoundException if no judgement exists for the given UUID.
   */
  @Get(':uuid')
  getJudgementStatusOrResult(
    @Param('uuid', new ParseUUIDPipe()) judgementId: string,
  ): Promise<JudgementResponse> {
    return this.judgementsService.getJudgementStatusOrResult(judgementId);
  }

  /**
   * Records a user's thumbs-up or thumbs-down vote on a judgement.
   * @param judgementId - The UUID of the judgement to vote on.
   * @param updateJudgementVoteDto - DTO containing `isLike` (boolean) representing the vote.
   * @returns 204 No Content on success.
   */
  @HttpCode(204)
  @Patch(':uuid/vote')
  updateJudgementVote(
    @Param('uuid', new ParseUUIDPipe()) judgementId: string,
    @Body() updateJudgementVoteDto: UpdateJudgementVoteDto,
  ) {
    this.judgementsService.updateJudgementVote(
      judgementId,
      updateJudgementVoteDto,
    );
  }
}

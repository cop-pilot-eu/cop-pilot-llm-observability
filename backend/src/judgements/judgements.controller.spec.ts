import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { JudgementsController } from './judgements.controller';
import { JudgementsService } from './judgements.service';
import { Judgement, JudgementStatus } from './entities/judgement.entity';
import { JudgementResponse } from './interfaces/judgement-response.interface';
import { UpdateJudgementVoteDto } from './dto/update-judgement-vote.dto';

const mockJudgement: Judgement = {
  id: faker.string.uuid(),
  agentEventId: faker.string.uuid(),
  status: JudgementStatus.PENDING,
  response: faker.lorem.sentence(),
  output: faker.lorem.sentence(),
  accuracy: faker.number.int({ min: 1, max: 5 }),
  relevance: faker.number.int({ min: 1, max: 5 }),
  reasoningQuality: faker.number.int({ min: 1, max: 5 }),
  hallucination: faker.datatype.boolean(),
  reasoning: faker.lorem.sentence(),
  userVote: faker.datatype.boolean(),
  latencyMs: faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  agentEvent: null,
};

describe('JudgementsController', () => {
  let controller: JudgementsController;
  const judgementId = mockJudgement.id;

  const mockJudgementsService = {
    getJudgementStatusOrResult: jest.fn(),
    updateJudgementVote: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JudgementsController],
      providers: [
        { provide: JudgementsService, useValue: mockJudgementsService },
      ],
    }).compile();

    controller = module.get<JudgementsController>(JudgementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getJudgementStatusOrResult', () => {
    describe('when judgement is COMPLETED', () => {
      it('should return the full evaluation data', async () => {
        const response: JudgementResponse = {
          status: JudgementStatus.COMPLETED,
          data: {
            response: mockJudgement.response,
            output: mockJudgement.output,
            accuracy: mockJudgement.accuracy,
            relevance: mockJudgement.relevance,
            reasoningQuality: mockJudgement.reasoningQuality,
            hallucination: mockJudgement.hallucination,
            reasoning: mockJudgement.reasoning,
            userVote: mockJudgement.userVote,
            latencyMs: mockJudgement.latencyMs,
            averageLatencyMs: faker.number.float({
              min: 10,
              max: 5000,
              fractionDigits: 2,
            }),
          },
          message: 'Judgement completed',
        };
        mockJudgementsService.getJudgementStatusOrResult.mockResolvedValue(
          response,
        );

        const result = await controller.getJudgementStatusOrResult(judgementId);

        expect(
          mockJudgementsService.getJudgementStatusOrResult,
        ).toHaveBeenCalledWith(judgementId);
        expect(result).toEqual(response);
      });
    });

    describe('when judgement is PENDING', () => {
      it('should return a pending status with a retry message', async () => {
        const response: JudgementResponse = {
          status: JudgementStatus.PENDING,
          message:
            'LLM is working to evaluate this event. Please try again later.',
        };
        mockJudgementsService.getJudgementStatusOrResult.mockResolvedValue(
          response,
        );

        const result = await controller.getJudgementStatusOrResult(judgementId);

        expect(
          mockJudgementsService.getJudgementStatusOrResult,
        ).toHaveBeenCalledWith(judgementId);
        expect(result).toEqual(response);
      });
    });

    describe('when judgement is FAILED', () => {
      it('should return a pending status with a re-evaluation message', async () => {
        const response: JudgementResponse = {
          status: JudgementStatus.PENDING,
          message:
            'Evaluation failed. Iniatiating new evaluation. Please try again later.',
        };
        mockJudgementsService.getJudgementStatusOrResult.mockResolvedValue(
          response,
        );

        const result = await controller.getJudgementStatusOrResult(judgementId);

        expect(
          mockJudgementsService.getJudgementStatusOrResult,
        ).toHaveBeenCalledWith(judgementId);
        expect(result).toEqual(response);
      });
    });

    describe('when judgement does not exist', () => {
      it('should propagate NotFoundException from service', async () => {
        mockJudgementsService.getJudgementStatusOrResult.mockRejectedValue(
          new NotFoundException('Judgement not found'),
        );

        await expect(
          controller.getJudgementStatusOrResult(judgementId),
        ).rejects.toThrow(new NotFoundException('Judgement not found'));
      });
    });
  });

  describe('updateJudgementVote', () => {
    describe('when a vote is submitted', () => {
      it.each([true, false])(
        'should delegate to the service and return void (isLike: %s)',
        async (isLike) => {
          const dto: UpdateJudgementVoteDto = { isLike };
          mockJudgementsService.updateJudgementVote.mockResolvedValue(
            undefined,
          );

          const result = controller.updateJudgementVote(judgementId, dto);

          expect(
            mockJudgementsService.updateJudgementVote,
          ).toHaveBeenCalledWith(judgementId, dto);
          expect(result).toBeUndefined();
        },
      );
    });
  });
});

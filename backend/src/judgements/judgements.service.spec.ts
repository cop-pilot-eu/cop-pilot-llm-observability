import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { faker } from '@faker-js/faker';
import { JudgementsService } from './judgements.service';
import { Judgement, JudgementStatus } from './entities/judgement.entity';
import { UpdateJudgementVoteDto } from './dto/update-judgement-vote.dto';
import { AgentEvent } from 'src/agent-events/entities/agent-event.entity';
import { Conversation } from 'src/agent-events/entities/conversation.entity';

const mockAgentEvent: AgentEvent = {
  id: faker.string.uuid(),
  agentId: faker.string.alphanumeric(5),
  conversationId: faker.string.uuid(),
  eventType: faker.string.alphanumeric(5),
  model: faker.helpers.arrayElement([
    'claude-sonnet-4-6',
    'claude-opus-4-6',
    'gpt-4o',
  ]),
  provider: faker.helpers.arrayElement(['anthropic', 'openai']),
  inputTokens: faker.number.int({ min: 1, max: 2000 }),
  completionTokens: faker.number.int({ min: 1, max: 1000 }),
  maxTokens: faker.number.int({ min: 256, max: 8192 }),
  latencyMs: faker.number.int({ min: 10, max: 5000 }),
  success: faker.datatype.boolean(),
  inputPrompt: faker.lorem.sentence(),
  responseText: faker.lorem.paragraph(),
  reasoningSteps: [faker.lorem.word(), faker.lorem.word()],
  mcpToolSelected: null,
  toolSelectionReasoning: null,
  toolSelectionConfidence: null,
  timestamp: faker.date.past(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  conversation: null,
};

const mockConversation: Conversation = {
  id: mockAgentEvent.conversationId,
  agentEvents: [mockAgentEvent],
  judgement: null,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
};

const mockJudgement: Judgement = {
  id: faker.string.uuid(),
  conversationId: mockConversation.id,
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
  conversation: mockConversation,
};

describe('JudgementsService', () => {
  let service: JudgementsService;
  const judgementId = mockJudgement.id;
  const completedJudgement = {
    ...mockJudgement,
    status: JudgementStatus.COMPLETED,
  };
  const failedJudgement = { ...mockJudgement, status: JudgementStatus.FAILED };

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const mockJudgementRepo = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    merge: jest.fn((target, source) => Object.assign(target, source)),
    findOne: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockHttpService = {
    axiosRef: {
      post: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JudgementsService,
        {
          provide: getRepositoryToken(Judgement),
          useValue: mockJudgementRepo,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<JudgementsService>(JudgementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJudgement', () => {
    describe('when called with a conversation id', () => {
      it('should create and save a judgement with PENDING status', async () => {
        mockJudgementRepo.findOne.mockResolvedValue(null);
        mockJudgementRepo.create.mockReturnValue(mockJudgement);
        mockJudgementRepo.save.mockResolvedValue(mockJudgement);

        const result = await service.createJudgement(mockConversation.id);

        expect(mockJudgementRepo.delete).not.toHaveBeenCalled();
        expect(mockJudgementRepo.create).toHaveBeenCalledWith({
          conversationId: mockConversation.id,
          status: JudgementStatus.PENDING,
        });
        expect(mockJudgementRepo.save).toHaveBeenCalledWith(mockJudgement);
        expect(result).toEqual(mockJudgement);
      });
    });
  });

  describe('executeLLMEvaluation', () => {
    const llmResult = {
      accuracy: mockJudgement.accuracy,
      relevance: mockJudgement.relevance,
      reasoningQuality: mockJudgement.reasoningQuality,
      hallucination: mockJudgement.hallucination,
      output: mockJudgement.output,
      latencyMs: mockJudgement.latencyMs,
    };

    beforeEach(() => {
      mockJudgementRepo.save.mockImplementation((judgement) =>
        Promise.resolve(judgement),
      );
    });

    describe('when LLM evaluation succeeds', () => {
      it('should reset status to PENDING, call LLM, and save the judgement as COMPLETED', async () => {
        mockJudgementRepo.update.mockResolvedValue(undefined);
        mockHttpService.axiosRef.post.mockResolvedValue({ data: llmResult });

        const result = await service.executeLLMEvaluation(
          { ...failedJudgement },
          mockConversation,
        );

        expect(mockJudgementRepo.update).toHaveBeenCalledWith(judgementId, {
          status: JudgementStatus.PENDING,
        });
        expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
          expect.stringContaining('/call-llm'),
          {
            conversationId: mockConversation.id,
            conversationHistory: [
              {
                success: mockAgentEvent.success,
                inputPrompt: mockAgentEvent.inputPrompt,
                responseText: mockAgentEvent.responseText,
                reasoning: mockAgentEvent.reasoningSteps.join(','),
                mcpToolSelected: mockAgentEvent.mcpToolSelected,
                toolSelectionReasoning: mockAgentEvent.toolSelectionReasoning,
              },
            ],
          },
        );
        expect(result).toMatchObject({
          ...llmResult,
          status: JudgementStatus.COMPLETED,
        });
      });
    });

    describe('when an agent event has no reasoning steps', () => {
      it('should send undefined reasoning and save the judgement as COMPLETED', async () => {
        mockHttpService.axiosRef.post.mockResolvedValue({ data: llmResult });
        const conversation: Conversation = {
          ...mockConversation,
          agentEvents: [{ ...mockAgentEvent, reasoningSteps: null }],
        };

        const result = await service.executeLLMEvaluation(
          { ...mockJudgement },
          conversation,
        );

        expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
          expect.stringContaining('/call-llm'),
          expect.objectContaining({
            conversationHistory: [
              expect.objectContaining({ reasoning: undefined }),
            ],
          }),
        );
        expect(result.status).toBe(JudgementStatus.COMPLETED);
      });
    });

    describe('when LLM evaluation fails', () => {
      it('should save the judgement as FAILED', async () => {
        mockHttpService.axiosRef.post.mockRejectedValue(
          new Error('LLM timeout'),
        );

        const result = await service.executeLLMEvaluation(
          { ...mockJudgement },
          mockConversation,
        );

        expect(result.status).toBe(JudgementStatus.FAILED);
      });
    });
  });

  describe('getJudgementStatusOrResult', () => {
    describe('when judgement does not exist', () => {
      it('should throw NotFoundException', async () => {
        mockJudgementRepo.findOne.mockResolvedValue(null);

        await expect(
          service.getJudgementStatusOrResult(judgementId),
        ).rejects.toThrow(new NotFoundException('Judgement not found'));
      });
    });

    describe('when judgement has an unknown status', () => {
      it('should throw an error', async () => {
        const unknownJudgement = {
          ...mockJudgement,
          status: 'UNKNOWN' as JudgementStatus,
        };
        mockJudgementRepo.findOne.mockResolvedValue(unknownJudgement);

        await expect(
          service.getJudgementStatusOrResult(judgementId),
        ).rejects.toThrow('Unhandled judgement status: UNKNOWN');
      });
    });

    describe('when judgement is COMPLETED', () => {
      it('should return full evaluation data with averageLatencyMs', async () => {
        mockJudgementRepo.findOne.mockResolvedValue(completedJudgement);
        mockQueryBuilder.getRawOne.mockResolvedValue({
          averageLatency: '1234.56',
        });

        const result = await service.getJudgementStatusOrResult(judgementId);

        expect(result.status).toBe(JudgementStatus.COMPLETED);
        expect(result.data).toBeDefined();
        expect(result.data.averageLatencyMs).toBe(1234.56);
        expect(result.data.accuracy).toBe(completedJudgement.accuracy);
        expect(result.data.relevance).toBe(completedJudgement.relevance);
        expect(result.data.output).toBe(completedJudgement.output);
        expect(result.message).toBe('Judgement completed');
      });

      it('should not expose id, agentEventId, agentEvent, createdAt, updatedAt or status in data', async () => {
        mockJudgementRepo.findOne.mockResolvedValue(completedJudgement);
        mockQueryBuilder.getRawOne.mockResolvedValue({ averageLatency: '100' });

        const result = await service.getJudgementStatusOrResult(judgementId);

        expect(result.data).not.toHaveProperty('id');
        expect(result.data).not.toHaveProperty('agentEventId');
        expect(result.data).not.toHaveProperty('agentEvent');
        expect(result.data).not.toHaveProperty('createdAt');
        expect(result.data).not.toHaveProperty('updatedAt');
        expect(result.data).not.toHaveProperty('status');
      });
    });

    describe('when judgement is PENDING', () => {
      it('should return a pending status with retry message and no data', async () => {
        mockJudgementRepo.findOne.mockResolvedValue(mockJudgement);

        const result = await service.getJudgementStatusOrResult(judgementId);

        expect(result.status).toBe(JudgementStatus.PENDING);
        expect(result.data).toBeUndefined();
        expect(result.message).toBe(
          'LLM is working to evaluate this event. Please try again later.',
        );
        expect(mockJudgementRepo.query).not.toHaveBeenCalled();
      });
    });

    describe('when judgement is FAILED', () => {
      it('should trigger judge LLM re-evaluation and return PENDING status', async () => {
        mockJudgementRepo.findOne.mockResolvedValue(failedJudgement);
        mockJudgementRepo.update.mockResolvedValue(undefined);
        mockJudgementRepo.query.mockResolvedValue([[failedJudgement], 1]);
        mockHttpService.axiosRef.post.mockReturnValue(new Promise(() => {}));

        const result = await service.getJudgementStatusOrResult(judgementId);

        expect(result.status).toBe(JudgementStatus.PENDING);
        expect(result.data).toBeUndefined();
        expect(result.message).toBe(
          'Evaluation failed. Iniatiating new evaluation. Please try again later.',
        );
        expect(mockJudgementRepo.update).toHaveBeenCalled();
      });

      it('should not await re-evaluation before returning', async () => {
        mockJudgementRepo.findOne.mockResolvedValue(failedJudgement);
        mockJudgementRepo.update.mockResolvedValue(undefined);
        mockHttpService.axiosRef.post.mockReturnValue(new Promise(() => {}));

        const result = await service.getJudgementStatusOrResult(judgementId);

        expect(result).toBeDefined();
      });
    });
  });

  describe('updateJudgementVote', () => {
    describe('when a vote is submitted', () => {
      it.each([true, false])(
        'should persist the vote (isLike: %s)',
        async (isLike) => {
          const dto: UpdateJudgementVoteDto = { isLike };
          mockJudgementRepo.update.mockResolvedValue(undefined);

          await service.updateJudgementVote(judgementId, dto);

          expect(mockJudgementRepo.update).toHaveBeenCalledWith(judgementId, {
            userVote: isLike,
          });
        },
      );
    });
  });
});

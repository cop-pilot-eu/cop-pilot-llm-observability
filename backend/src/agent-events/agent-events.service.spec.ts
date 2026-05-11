import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AgentEventsService } from './agent-events.service';
import { AgentEvent } from './entities/agent-event.entity';
import { JudgementsService } from 'src/judgements/judgements.service';
import {
  Judgement,
  JudgementStatus,
} from 'src/judgements/entities/judgement.entity';
import { CreateAgentEventDto } from './dto/create-agent-event.dto';
import { faker } from '@faker-js/faker';
import { AgentEventHistoryItem } from 'src/judgements/interfaces/agent-event-history-item.interface';

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
  judgement: null,
};

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
  agentEvent: mockAgentEvent,
};

describe('AgentEventsService', () => {
  let service: AgentEventsService;

  const mockAgentEventRepo = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockJudgementsService = {
    createJudgement: jest.fn(),
    executeLLMEvaluation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentEventsService,
        {
          provide: getRepositoryToken(AgentEvent),
          useValue: mockAgentEventRepo,
        },
        {
          provide: JudgementsService,
          useValue: mockJudgementsService,
        },
      ],
    }).compile();

    service = module.get<AgentEventsService>(AgentEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleIncomingAgentEvent', () => {
    const dto: CreateAgentEventDto = {
      agentId: mockAgentEvent.agentId,
      conversationId: mockAgentEvent.conversationId,
      eventType: mockAgentEvent.eventType,
      model: mockAgentEvent.model,
      provider: mockAgentEvent.provider,
      inputTokens: mockAgentEvent.inputTokens,
      completionTokens: mockAgentEvent.completionTokens,
      maxTokens: mockAgentEvent.maxTokens,
      latencyMs: mockAgentEvent.latencyMs,
      success: mockAgentEvent.success,
      inputPrompt: mockAgentEvent.inputPrompt,
      responseText: mockAgentEvent.responseText,
      reasoningSteps: mockAgentEvent.reasoningSteps,
      mcpToolSelected: null,
      toolSelectionReasoning: null,
      toolSelectionConfidence: null,
      timestamp: mockAgentEvent.timestamp,
    };

    describe('when agent event is received', () => {
      it('should save the event, create a judgement, and trigger async LLM evaluation', async () => {
        mockAgentEventRepo.save.mockResolvedValue(mockAgentEvent);
        mockJudgementsService.createJudgement.mockResolvedValue(mockJudgement);
        mockJudgementsService.executeLLMEvaluation.mockResolvedValue(undefined);

        const result = await service.handleIncomingAgentEvent(dto);

        expect(mockAgentEventRepo.save).toHaveBeenCalledWith(dto);
        expect(mockJudgementsService.createJudgement).toHaveBeenCalledWith(
          mockAgentEvent,
        );
        expect(mockJudgementsService.executeLLMEvaluation).toHaveBeenCalledWith(
          mockJudgement.id,
          mockAgentEvent,
        );
        expect(result).toEqual({
          event: mockAgentEvent,
          judgement: mockJudgement,
        });
      });

      it('should not await executeLLMEvaluation', async () => {
        mockAgentEventRepo.save.mockResolvedValue(mockAgentEvent);
        mockJudgementsService.createJudgement.mockResolvedValue(mockJudgement);

        mockJudgementsService.executeLLMEvaluation.mockReturnValue(
          new Promise(() => {}),
        );

        const result = await service.handleIncomingAgentEvent(dto);

        expect(result).toEqual({
          event: mockAgentEvent,
          judgement: mockJudgement,
        });
        expect(mockJudgementsService.executeLLMEvaluation).toHaveBeenCalled();
      });
    });
  });

  describe('getAgentSummary', () => {
    const agentId = mockAgentEvent.agentId;

    const mockRaw = {
      avgInputTokens: '500.50',
      avgLatencyMs: '200.00',
      avgSuccessRate: null,
      totalNumberOfCalls: '10',
      avgAccuracy: '4.50',
      avgRelevance: '3.75',
      avgReasoningQuality: '4.00',
      avgHallucination: '0.20',
    };

    const mockSuccessRaw = [
      { timestamp: mockAgentEvent.timestamp, success: true },
    ];

    const mockHistoryItems: AgentEventHistoryItem[] = [
      {
        id: mockAgentEvent.id,
        agentId,
        inputPrompt: mockAgentEvent.inputPrompt,
        responseText: mockAgentEvent.responseText,
        timestamp: mockAgentEvent.timestamp,
        judgement: { id: mockJudgement.id, status: JudgementStatus.PENDING },
      },
    ];

    const mockQueryBuilder = {
      distinct: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
    };

    beforeEach(() => {
      mockAgentEventRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    describe('when agent exists', () => {
      beforeEach(() => {
        mockAgentEventRepo.findOne.mockResolvedValue(mockAgentEvent);
        mockQueryBuilder.getRawOne.mockResolvedValue(mockRaw);
        mockAgentEventRepo.find
          .mockResolvedValueOnce(mockSuccessRaw)
          .mockResolvedValueOnce(mockHistoryItems);
      });

      it('should return events grouped by agentId and metrics', async () => {
        const result = await service.getAgentSummary(agentId);

        expect(mockAgentEventRepo.findOne).toHaveBeenCalledWith({
          where: { agentId },
        });
        expect(result.events).toHaveProperty(agentId);
        expect(result.metrics.agentMetrics.avgInputTokens).toBe(500.5);
        expect(result.metrics.agentMetrics.avgLatencyMs).toBe(200);
        expect(result.metrics.agentMetrics.avgSuccessRate).toBe(null);
        expect(result.metrics.agentMetrics.totalNumberOfCalls).toBe(10);
        expect(result.metrics.judgementMetrics.avgAccuracy).toBe(4.5);
        expect(result.metrics.judgementMetrics.avgRelevance).toBe(3.75);
        expect(result.metrics.judgementMetrics.avgReasoningQuality).toBe(4);
        expect(result.metrics.judgementMetrics.avgHallucination).toBe(0.2);
        expect(result.metrics.successChart).toEqual(mockSuccessRaw);
      });
    });

    describe('when agent does not exist', () => {
      it('should throw NotFoundException', async () => {
        mockAgentEventRepo.findOne.mockResolvedValue(null);

        await expect(service.getAgentSummary(agentId)).rejects.toThrow(
          new NotFoundException(`Events for agent '${agentId}' not found`),
        );
      });
    });
  });

  describe('getAgentIds', () => {
    const mockQueryBuilder = {
      distinct: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    beforeEach(() => {
      mockAgentEventRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    describe('when agents exist', () => {
      it('should return all distinct agent ids', async () => {
        const agentIds = [
          { agentId: faker.string.alphanumeric(5) },
          { agentId: faker.string.alphanumeric(5) },
        ];
        mockQueryBuilder.getRawMany.mockResolvedValue(agentIds);

        const result = await service.getAgentIds();

        expect(result).toEqual({
          agentIds: agentIds.map(({ agentId }) => agentId),
        });
      });
    });

    describe('when no agents exist', () => {
      it('should return empty agentIds array', async () => {
        mockQueryBuilder.getRawMany.mockResolvedValue([]);

        const result = await service.getAgentIds();

        expect(result).toEqual({ agentIds: [] });
      });
    });
  });
});

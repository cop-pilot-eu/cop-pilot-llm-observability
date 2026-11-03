import { Test, TestingModule } from '@nestjs/testing';
import { AgentEventsController } from './agent-events.controller';
import { AgentEventsService } from './agent-events.service';
import { CreateAgentEventDto } from './dto/create-agent-event.dto';
import {
  Judgement,
  JudgementStatus,
} from 'src/judgements/entities/judgement.entity';
import { faker } from '@faker-js/faker';
import { AgentEventHistoryItem } from 'src/judgements/interfaces/agent-event-history-item.interface';
import { AgentDashboardMetrics } from 'src/judgements/interfaces/agent-dashboard-metrics.interface';
import { AgentEvent } from './entities/agent-event.entity';
import { Conversation } from './entities/conversation.entity';

const mockAgentEvent: AgentEvent = {
  id: faker.string.uuid(),
  agentId: faker.string.alphanumeric(5),
  conversationId: faker.string.uuid(),
  conversation: null,
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
};

const mockJudgement: Judgement = {
  id: faker.string.uuid(),
  conversationId: mockAgentEvent.conversationId,
  conversation: null,
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
};

const mockConversation: Conversation = {
  id: mockAgentEvent.conversationId,
  agentEvents: [mockAgentEvent],
  judgement: mockJudgement,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
};

describe('AgentEventsController', () => {
  let controller: AgentEventsController;

  const mockAgentEventsService = {
    handleIncomingAgentEvent: jest.fn(),
    getAgentSummary: jest.fn(),
    getAgentIds: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentEventsController],
      providers: [
        { provide: AgentEventsService, useValue: mockAgentEventsService },
      ],
    }).compile();

    controller = module.get<AgentEventsController>(AgentEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleIncomingAgentEvent', () => {
    describe('when agent event is received', () => {
      it('should call service and return the conversation and judgement', async () => {
        const dto: CreateAgentEventDto = {
          timestamp: faker.date.past(),
          agentId: faker.string.uuid(),
          conversationId: faker.string.uuid(),
          eventType: 'llm_call',
          model: faker.helpers.arrayElement([
            'claude-sonnet-4-6',
            'claude-opus-4-6',
            'gpt-4o',
          ]),
          provider: faker.helpers.arrayElement(['anthropic', 'openai']),
          inputTokens: faker.number.int({ min: 1, max: 2000 }),
          completionTokens: faker.number.int({ min: 1, max: 1000 }),
          maxTokens: faker.number.int({ min: 256, max: 8192 }),
          latencyMs: faker.number.int({
            min: 10,
            max: 5000,
          }),
          success: faker.datatype.boolean(),
          inputPrompt: faker.lorem.sentence(),
          responseText: faker.lorem.paragraph(),
          reasoningSteps: [faker.lorem.word()],
          mcpToolSelected: null,
          toolSelectionReasoning: null,
          toolSelectionConfidence: null,
        };

        const expected = {
          conversation: mockConversation,
          judgement: mockJudgement,
        };
        mockAgentEventsService.handleIncomingAgentEvent.mockResolvedValue(
          expected,
        );

        const result = await controller.handleIncomingAgentEvent(dto);

        expect(
          mockAgentEventsService.handleIncomingAgentEvent,
        ).toHaveBeenCalledWith(dto);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('getAgentEvents', () => {
    describe('when agent id is provided', () => {
      it('should call service with the agent id and return the summary', async () => {
        const agentId = mockAgentEvent.agentId;
        const summary: {
          events: AgentEventHistoryItem[];
          metrics: AgentDashboardMetrics;
        } = {
          events: [
            {
              conversationId: mockAgentEvent.conversationId,
              judgement: { id: mockJudgement.id, status: mockJudgement.status },
              events: [
                {
                  id: mockAgentEvent.id,
                  agentId,
                  inputPrompt: mockAgentEvent.inputPrompt,
                  responseText: mockAgentEvent.responseText,
                  timestamp: mockAgentEvent.timestamp,
                },
              ],
            },
          ],
          metrics: {
            agentMetrics: {
              avgInputTokens: faker.number.float({
                min: 1,
                max: 2000,
                fractionDigits: 2,
              }),
              avgLatencyMs: faker.number.float({
                min: 10,
                max: 5000,
                fractionDigits: 2,
              }),
              avgSuccessRate: faker.number.float({
                min: 0,
                max: 1,
                fractionDigits: 2,
              }),
              totalNumberOfCalls: faker.number.int({ min: 1, max: 100 }),
            },
            judgementMetrics: {
              avgAccuracy: faker.number.float({
                min: 1,
                max: 5,
                fractionDigits: 2,
              }),
              avgRelevance: faker.number.float({
                min: 1,
                max: 5,
                fractionDigits: 2,
              }),
              avgReasoningQuality: faker.number.float({
                min: 1,
                max: 5,
                fractionDigits: 2,
              }),
              avgHallucination: faker.number.float({
                min: 1,
                max: 5,
                fractionDigits: 2,
              }),
            },
            successChart: [
              {
                timestamp: faker.date.past(),
                success: faker.datatype.boolean(),
              },
            ],
          },
        };
        mockAgentEventsService.getAgentSummary.mockResolvedValue(summary);

        const result = await controller.getAgentEvents(agentId);

        expect(mockAgentEventsService.getAgentSummary).toHaveBeenCalledWith(
          agentId,
        );
        expect(result).toEqual(summary);
      });
    });
  });

  describe('getAgentIds', () => {
    describe('when agents ids exist', () => {
      it('should return list of agent ids', async () => {
        const expected: { agentIds: string[] } = {
          agentIds: [faker.string.uuid(), faker.string.uuid()],
        };
        mockAgentEventsService.getAgentIds.mockResolvedValue(expected);

        const result = await controller.getAgentIds();

        expect(mockAgentEventsService.getAgentIds).toHaveBeenCalled();
        expect(result).toEqual(expected);
      });
    });

    describe('when no agents exist', () => {
      it('should return empty list', async () => {
        const expected: { agentIds: string[] } = { agentIds: [] };
        mockAgentEventsService.getAgentIds.mockResolvedValue(expected);

        const result = await controller.getAgentIds();

        expect(result).toEqual(expected);
      });
    });
  });
});

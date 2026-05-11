import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAgentEventDto {
  @IsNotEmpty()
  @IsDateString()
  timestamp: Date;

  @IsNotEmpty()
  @IsString()
  agentId: string;

  @IsNotEmpty()
  @IsUUID()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  eventType: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsInt()
  inputTokens: number;

  @IsNotEmpty()
  @IsInt()
  completionTokens: number;

  @IsNotEmpty()
  @IsInt()
  maxTokens: number;

  @IsNotEmpty()
  @IsInt()
  latencyMs: number;

  @IsNotEmpty()
  @IsBoolean()
  success: boolean;

  @IsNotEmpty()
  @IsString()
  inputPrompt: string;

  @IsNotEmpty()
  @IsString()
  responseText: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasoningSteps?: string[];

  @IsOptional()
  @IsString()
  mcpToolSelected?: string;

  @IsOptional()
  @IsString()
  toolSelectionReasoning?: string;

  @IsOptional()
  @IsObject()
  toolSelectionConfidence?: Record<string, number>;
}

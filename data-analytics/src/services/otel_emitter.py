from typing import Any, Optional

from opentelemetry.sdk._logs import LoggerProvider
from opentelemetry.sdk._logs.export import ConsoleLogRecordExporter, SimpleLogRecordProcessor
from opentelemetry.sdk.resources import Resource

from ..models.llm_payload_model import Conversation
from ..models.llm_response_model import LLMResponse
from ..models.otel_events import (
    GenAIEvaluationResult,
    GenAIInferenceDetails,
    GenAIMessage,
    MessagePart,
    TextPart,
    ToolCallPart,
)

_provider = LoggerProvider(resource=Resource.create({"service.name": "data-analytics"}))
_provider.add_log_record_processor(SimpleLogRecordProcessor(ConsoleLogRecordExporter()))
_logger = _provider.get_logger("gen_ai_observability")


def conversation_to_inference_details(
    conversation_id: str, conversation: Conversation, *, request_model: Optional[str] = None
) -> GenAIInferenceDetails:
    input_messages = [GenAIMessage(role="user", parts=[TextPart(content=conversation.input_prompt)])]

    output_parts: list[MessagePart] = []
    if conversation.mcp_tool_selected:
        output_parts.append(ToolCallPart(id=conversation_id, name=conversation.mcp_tool_selected))
    output_parts.append(TextPart(content=conversation.response_text))
    output_messages = [GenAIMessage(role="assistant", parts=output_parts)]

    return GenAIInferenceDetails(
        conversation_id=conversation_id,
        request_model=request_model,
        input_messages=input_messages,
        output_messages=output_messages,
        reasoning=conversation.reasoning,
        tool_selection_reasoning=conversation.tool_selection_reasoning,
    )


def judge_to_evaluation_results(judge: LLMResponse, *, response_id: Optional[str] = None) -> list[GenAIEvaluationResult]:
    results = [
        GenAIEvaluationResult(
            evaluation_name="accuracy", score_value=judge.accuracy, explanation=judge.output, response_id=response_id
        ),
        GenAIEvaluationResult(
            evaluation_name="relevance", score_value=judge.relevance, explanation=judge.output, response_id=response_id
        ),
    ]
    if judge.reasoning_quality is not None:
        results.append(
            GenAIEvaluationResult(
                evaluation_name="reasoning_quality",
                score_value=judge.reasoning_quality,
                explanation=judge.output,
                response_id=response_id,
            )
        )
    if judge.hallucination is not None:
        results.append(
            GenAIEvaluationResult(
                evaluation_name="hallucination",
                score_label="fail" if judge.hallucination else "pass",
                explanation=judge.output,
                response_id=response_id,
            )
        )
    return results


def emit_inference_details(details: GenAIInferenceDetails) -> None:
    attributes: dict[str, Any] = {
        "gen_ai.operation.name": details.operation_name,
        "gen_ai.provider.name": details.provider_name,
        "gen_ai.conversation.id": details.conversation_id,
        "gen_ai.input.messages": [m.model_dump(by_alias=True) for m in details.input_messages],
        "gen_ai.output.messages": [m.model_dump(by_alias=True) for m in details.output_messages],
    }
    if details.request_model:
        attributes["gen_ai.request.model"] = details.request_model
    if details.response_model:
        attributes["gen_ai.response.model"] = details.response_model
    if details.reasoning:
        attributes["osom.reasoning"] = details.reasoning
    if details.tool_selection_reasoning:
        attributes["osom.tool_selection_reasoning"] = details.tool_selection_reasoning

    _logger.emit(event_name="gen_ai.client.inference.operation.details", attributes=attributes)


def emit_evaluation_result(result: GenAIEvaluationResult) -> None:
    attributes: dict[str, Any] = {"gen_ai.evaluation.name": result.evaluation_name}
    if result.score_value is not None:
        attributes["gen_ai.evaluation.score.value"] = result.score_value
    if result.score_label is not None:
        attributes["gen_ai.evaluation.score.label"] = result.score_label
    if result.explanation is not None:
        attributes["gen_ai.evaluation.explanation"] = result.explanation
    if result.response_id is not None:
        attributes["gen_ai.response.id"] = result.response_id
    if result.error_type is not None:
        attributes["error.type"] = result.error_type

    _logger.emit(event_name="gen_ai.evaluation.result", attributes=attributes)

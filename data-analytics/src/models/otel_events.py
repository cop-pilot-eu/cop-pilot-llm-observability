from typing import Any, Literal, Optional, Union

from .camel_case_model import CamelCaseModel

# ---- gen_ai.input.messages / gen_ai.output.messages parts ----

class TextPart(CamelCaseModel):
    type: Literal["text"] = "text"
    content: str


class ToolCallPart(CamelCaseModel):
    type: Literal["tool_call"] = "tool_call"
    id: str
    name: str
    arguments: dict[str, Any] = {}


class ToolCallResponsePart(CamelCaseModel):
    type: Literal["tool_call_response"] = "tool_call_response"
    id: str
    response: Any


MessagePart = Union[TextPart, ToolCallPart, ToolCallResponsePart]


class GenAIMessage(CamelCaseModel):
    role: Literal["system", "user", "assistant", "tool"]
    parts: list[MessagePart]


# ---- gen_ai.client.inference.operation.details ----

class GenAIInferenceDetails(CamelCaseModel):
    operation_name: str = "chat"                  # gen_ai.operation.name
    provider_name: str = "mistralai"           # gen_ai.provider.name
    conversation_id: str                          # gen_ai.conversation.id
    request_model: Optional[str] = None           # gen_ai.request.model
    response_model: Optional[str] = None          # gen_ai.response.model
    input_messages: list[GenAIMessage]            # gen_ai.input.messages
    output_messages: list[GenAIMessage]           # gen_ai.output.messages
    # not part of the OTel spec, kept as custom osom.* attributes on the event
    reasoning: Optional[str] = None
    tool_selection_reasoning: Optional[str] = None


# ---- gen_ai.evaluation.result (one instance per metric) ----

class GenAIEvaluationResult(CamelCaseModel):
    evaluation_name: str                          # gen_ai.evaluation.name
    score_value: Optional[float] = None           # gen_ai.evaluation.score.value
    score_label: Optional[str] = None             # gen_ai.evaluation.score.label
    explanation: Optional[str] = None             # gen_ai.evaluation.explanation
    response_id: Optional[str] = None             # gen_ai.response.id
    error_type: Optional[str] = None               # error.type

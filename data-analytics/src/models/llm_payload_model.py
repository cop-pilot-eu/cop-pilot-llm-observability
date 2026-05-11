from typing import Optional

from .camel_case_model import CamelCaseModel


class Conversation(CamelCaseModel):
    input_prompt: str
    response_text: str
    success: bool
    reasoning: Optional[str] = None
    mcp_tool_selected: Optional[str] = None
    tool_selection_reasoning: Optional[str] = None


class LLMPayload(CamelCaseModel):
    conversation_id: str
    conversation_history: list[Conversation]

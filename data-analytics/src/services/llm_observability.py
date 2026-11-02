import time

import os
from pathlib import Path

from pydantic import BaseModel, Field

from mistralai.client import Mistral
from ..models.llm_payload_model import Conversation

SYSTEM_INSTRUCTIONS_PATH = Path(__file__).resolve().parent.parent / "prompts" / "judge_system_instructions.md"


class NoSuccessfulTurnsError(ValueError):
    pass


class Judge(BaseModel):
    output: str = Field(description="Justification for the scores, noting if tools/reasoning were expected but missing.")
    accuracy: int = Field(ge=0, le=5, description="How factually/technically correct the output is relative to the input.")
    relevance: int = Field(ge=0, le=5, description="How well the response addresses the user's specific intent.")
    reasoning_quality: int | None = Field(
        None, ge=0, le=5, description="Rate the logic if provided; return null if no reasoning was generated."
    )
    hallucination: bool = Field(description="True if the model invented information.")


class LLMObservability:
    MODEL_NAME = "mistral-large-2512"
    SEED = 16
    def __init__(self, conversation_id: str, conversation_history: list[Conversation]) -> None:
        self.conversation_id = conversation_id
        self.conversation_history = conversation_history
        self.user_inputs = [c.input_prompt for c in conversation_history]
        self.model_outputs = [c.response_text for c in conversation_history]
        self.reasoning = [c.reasoning for c in conversation_history]
        self.mcp_tools_selected = [c.mcp_tool_selected for c in conversation_history]
        self.tool_selection_reasoning = [c.tool_selection_reasoning for c in conversation_history]
        self.success = [c.success for c in conversation_history]

    @staticmethod
    def _system_instructions() -> str:
        return SYSTEM_INSTRUCTIONS_PATH.read_text(encoding="utf-8")

    def _llm_prompt(self) -> str:
        all_turns = []
        empty_keywords = ["none", "null", "[]", "nan"]

        for i, turn in enumerate(self.conversation_history):
            if turn.success:
                turn_parts = [
                    f"### Turn {i + 1}",
                    f"**User Input**: {turn.input_prompt}",
                    f"**Model Output**: {turn.response_text}",
                ]
                if turn.reasoning and str(turn.reasoning).lower() not in empty_keywords:
                    turn_parts.append(f"**Reasoning (Case B)**: {turn.reasoning}")

                if turn.mcp_tool_selected and str(turn.mcp_tool_selected).lower() not in empty_keywords:
                    turn_parts.append(f"**MCP Tool Selected (Case C)**: {turn.mcp_tool_selected}")
                    if turn.tool_selection_reasoning and str(turn.tool_selection_reasoning).lower() not in empty_keywords:
                        turn_parts.append(f"**MCP Selection Logic**: {turn.tool_selection_reasoning}")
                all_turns.append("\n".join(turn_parts))
        if not all_turns:
            raise NoSuccessfulTurnsError("No successful turns found. Skipping Judge LLM call.")
        return "\n\n---\n\n".join(all_turns)

    def get_llm_response(self) -> dict:
        client = Mistral(api_key=os.environ.get("MISTRAL_API_KEY"))

        start_time = time.perf_counter()
        response = client.chat.parse(
            model=self.MODEL_NAME,
            messages=[
                {"role": "system", "content": self._system_instructions()},
                {"role": "user", "content": self._llm_prompt()},
            ],
            temperature=0,
            random_seed=self.SEED,
            response_format=Judge,
        )
        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        judge_metrics = response.choices[0].message.parsed.model_dump()
        judge_metrics["latency_ms"] = round(latency_ms, 2)
        return judge_metrics

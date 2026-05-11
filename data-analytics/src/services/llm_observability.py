import json
import time
from typing import Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from ..models.llm_payload_model import Conversation


class Judge(BaseModel):
    output: str = Field(description="Justification for the scores, noting if tools/reasoning were expected but missing.")
    accuracy: int = Field(ge=1, le=5, description="How factually/technically correct the output is relative to the input.")
    relevance: int = Field(ge=1, le=5, description="How well the response addresses the user's specific intent.")
    reasoning_quality: Optional[int] = Field(
        None, ge=1, le=5, description="Rate the logic if provided; return null if no reasoning was generated."
    )
    hallucination: bool = Field(description="True if the model invented information.")


class LLMObservability:
    MODEL_NAME = "gemini-2.5-flash-lite"
    PROJECT = "circulartwain-458407"
    LOCATION = "us-central1"

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
        return """
        You are a Quality Assurance Judge for a Multi-Agent system (OSOM).
        Your task is to evaluate an LLM's response based on the provided Input Prompt and Output.

        ### Evaluation Framework:
        Analyze the interaction based on which components are present:

        1. **Case A: Direct Completion** (No reasoning, no tools)
        - Focus on **Accuracy** and **Relevance**.
        - Does the text directly answer the prompt without adding "fluff" or incorrect facts?

        2. **Case B: Reasoning/Chain-of-Thought** (Reasoning steps provided)
        - Evaluate the **reasoning_score**. Is the logic sound?
        - Does the reasoning actually lead to the final answer, or is it disconnected?

        3. **Case C: Tool Selection** (MCP tools or function calls involved)
        - Check if the tool choice was logical for the task.
        - If a tool was used, does the **response_text** correctly reflect the tool's intended purpose?

        ### Specific Constraints:
        - **Hallucination**: Mark as TRUE if the model references specific IDs (e.g. Service Order numbers), timestamps, or technical specs that were NOT in the input prompt.
        - **Scoring**: Use a 1-5 scale. A '3' is functional but flawed; a '5' is perfect, concise, and logically sound.

        ### Tone:
        Be an objective, technical auditor. Your 'judgement' field must cite specific parts of the input/output to justify your scores.
        """

    def _llm_prompt(self) -> str:
        all_turns = []
        empty_keywords = ["none", "null", "[]", "nan"]

        for i, turn in enumerate(self.conversation_history):
            if turn.success:
                turn_parts = [
                    f"### Turn {i+1}",
                    f"**User Input**: {turn.input_prompt}",
                    f"**Model Output**: {turn.response_text}"
                ]
                if turn.reasoning and str(turn.reasoning).lower() not in empty_keywords:
                    turn_parts.append(f"**Reasoning (Case B)**: {turn.reasoning}")

                if turn.mcp_tool_selected and str(turn.mcp_tool_selected).lower() not in empty_keywords:
                    turn_parts.append(f"**MCP Tool Selected (Case C)**: {turn.mcp_tool_selected}")
                    if turn.tool_selection_reasoning and str(turn.tool_selection_reasoning).lower() not in empty_keywords:
                        turn_parts.append(f"**MCP Selection Logic**: {turn.tool_selection_reasoning}")
                all_turns.append("\n".join(turn_parts))
        return "\n\n---\n\n".join(all_turns)
        if not all_turns:
            raise ValueError("No successful turns found. Skipping Judge LLM call.")


    def get_llm_response(self) -> dict:
        # to run locally uncomment the two lines below
        # import os
        # os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./.venv/credentials/circ_twain.json"
        client = genai.Client(
            vertexai=True,
            project=self.PROJECT,
            location=self.LOCATION,
        )

        config = types.GenerateContentConfig(
            temperature=0,
            top_p=0,
            top_k=1,
            max_output_tokens=1000,
            system_instruction=[types.Part.from_text(text=self._system_instructions())],
            response_mime_type="application/json",
            response_json_schema=Judge.model_json_schema(),
        )

        start_time = time.perf_counter()
        response = client.models.generate_content(
            model=self.MODEL_NAME,
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=self._llm_prompt())])],
            config=config,
        )
        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        judge_metrics = json.loads(response.text)
        judge_metrics["latency_ms"] = round(latency_ms, 2)
        return judge_metrics

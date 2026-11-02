from typing import Optional

from .camel_case_model import CamelCaseModel


class LLMResponse(CamelCaseModel):
    accuracy: int
    relevance: int
    reasoning_quality: Optional[int] = None
    hallucination: bool
    output: str
    latency_ms: float

from typing import Optional

from .camel_case_model import CamelCaseModel


class LLMResponse(CamelCaseModel):
    accuracy: Optional[int] = None
    relevance: Optional[int] = None
    reasoning_quality: Optional[int] = None
    hallucination: Optional[bool] = None
    output: Optional[str] = None
    latency_ms: Optional[float] = None

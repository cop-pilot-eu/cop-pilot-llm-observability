from ..models.llm_payload_model import LLMPayload
from ..models.llm_response_model import LLMResponse
from .llm_observability import LLMObservability


class LLMService:
    @staticmethod
    def call_llm(payload: LLMPayload) -> LLMResponse:
        llm_obs = LLMObservability(conversation_id=payload.conversation_id, conversation_history=payload.conversation_history)
        judge_results = llm_obs.get_llm_response()
        return LLMResponse(**judge_results)


llm_service = LLMService()

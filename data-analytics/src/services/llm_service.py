from ..models.llm_payload_model import LLMPayload
from ..models.llm_response_model import LLMResponse
from .llm_observability import LLMObservability
from .otel_emitter import (
    conversation_to_inference_details,
    emit_evaluation_result,
    emit_inference_details,
    judge_to_evaluation_results,
)


class LLMService:
    @staticmethod
    def call_llm(payload: LLMPayload) -> LLMResponse:
        llm_obs = LLMObservability(conversation_id=payload.conversation_id, conversation_history=payload.conversation_history)
        judge_results = llm_obs.get_llm_response()
        llm_response = LLMResponse(**judge_results)

        for conversation in payload.conversation_history:
            details = conversation_to_inference_details(
                payload.conversation_id, conversation, request_model=LLMObservability.MODEL_NAME
            )
            emit_inference_details(details)

        for result in judge_to_evaluation_results(llm_response):
            emit_evaluation_result(result)

        return llm_response


llm_service = LLMService()

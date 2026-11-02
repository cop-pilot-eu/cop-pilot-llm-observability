from fastapi import APIRouter, HTTPException

from ..models.llm_payload_model import LLMPayload
from ..models.llm_response_model import LLMResponse
from ..services.llm_observability import NoSuccessfulTurnsError
from ..services.llm_service import llm_service

router = APIRouter()


@router.post("/call-llm", tags=["call-llm"])
async def call_llm(payload: LLMPayload) -> LLMResponse:
    try:
        return llm_service.call_llm(payload=payload)
    except NoSuccessfulTurnsError as e:
        raise HTTPException(status_code=422, detail=str(e))

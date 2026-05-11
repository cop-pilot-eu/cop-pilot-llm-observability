import argparse

from src.models.llm_payload_model import Conversation, LLMPayload
from src.services.llm_service import LLMService

# Setup the argument parser
parser = argparse.ArgumentParser()
parser.add_argument("conversation_id")
parser.add_argument("input")
parser.add_argument("response")
parser.add_argument("success")
parser.add_argument("--reasoning")
parser.add_argument("--mcp_tool_selected")
parser.add_argument("--tool_selection_reasoning")
# Parse the arguments
args = parser.parse_args()

# Run the function
result = LLMService.call_llm(
    payload=LLMPayload(
        conversation_id=args.conversation_id,
        conversation_history=[
            Conversation(
                input_prompt=args.input,
                response_text=args.response,
                success=args.success,
                reasoning=args.reasoning,
                mcp_tool_selected=args.mcp_tool_selected,
                tool_selection_reasoning=args.tool_selection_reasoning,
            )
        ],
    )
)

print(f"Result: {result}")

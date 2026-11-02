import pandas as pd
from src.models.llm_payload_model import Conversation, LLMPayload
from src.services.llm_service import LLMService

SCENARIOS = {
    "test-01": "Perfect",
    "test-02": "High accuracy, low relevance",
    "test-03": "Low accuracy, high relevance",
    "test-04": "Hallucination",
    "test-05": "Completely wrong",
    "test-06": "No reasoning, no tools",
}

# select the id to run
conversation_id = "test-05"

ORDER = ("Create a service order for an isolated, low-latency 5G network slice for Sector A "
         "with edge latency at or below 10 ms and bandwidth of 1 Gbps.")
source_df = pd.DataFrame({
    "conversation_id": ["test-01", "test-02", "test-03", "test-04", "test-05", "test-06"],
    "success": ["TRUE", "TRUE", "TRUE", "TRUE", "TRUE", "TRUE"],
    "input_prompt": [
        ORDER,                                                           # 1 perfect
        ORDER,                                                           # 2 high accuracy, low relevance
        ORDER,                                                           # 3 low accuracy, high relevance
        "Apply the characteristic latency=10ms to Service Order #882.",  # 4 hallucination
        ORDER,                                                           # 5 completely wrong
        ORDER,                                                           # 6 no reasoning, no tools
    ],
    "response_text": [
        # 1
        "Created a service order for a 5G network slice in Sector A with isolation enabled, "
        "edge latency at or below 10 ms and bandwidth of 1 Gbps.",
        # 2
        "Created a service order for a 5G network slice in Sector A with isolation enabled, "
        "edge latency at or below 10 ms and bandwidth of 1 Gbps. By the way, 5G is a fascinating "
        "technology and network slicing is one of its most interesting features. Many operators are "
        "exploring how automation could change network management in the future. Good network "
        "security practices are always important too, so remember to review them regularly.",
        # 3
        "Created a service order for a 5G network slice in Sector A.",
        # 4
        "Applied latency=10ms to Service Order #882. The order was also linked to SLA contract "
        "SLA-2291 and approved by the Operations team at 14:32 UTC, with 99.999% availability guaranteed.",
        # 5
        "Network slicing divides one physical network into several virtual networks, each tailored "
        "to a use case. Let me know if you would like an overview of slicing concepts.",
        # 6
        "Draft service order: 5G network slice for Sector A, isolation enabled, edge latency at or "
        "below 10 ms, bandwidth 1 Gbps.",
    ],
    "reasoning_steps": [
        "['Matched the request to a 5G slice specification in the catalog', "
        "'Mapped isolation, 10 ms latency and 1 Gbps bandwidth to order characteristics', "
        "'Created the service order with all three characteristics']",
        "['Matched the request to a 5G slice specification in the catalog', "
        "'Mapped isolation, 10 ms latency and 1 Gbps bandwidth to order characteristics', "
        "'Created the service order with all three characteristics']",
        "['Identified a request for a 5G slice order', 'Created the order for Sector A']",
        "['Retrieved Service Order #882', 'Set the latency characteristic to 10 ms']",
        "['Interpreted the request as a question about network slicing', 'Answered from general knowledge']",
        "[]",
    ],
    "mcp_tool_selected": ["service_order_create", "service_order_create", "service_order_create",
                          "service_order_update", "", ""],
    "tool_selection_reasoning": [
        "The intent asks to create an order, so the order-creation tool is the right choice once the specification is found.",
        "The intent asks to create an order, so the order-creation tool is the right choice once the specification is found.",
        "Order creation fits the request, but only the service type and location were passed as arguments.",
        "Updating an existing order's characteristics matches the request.",
        "",
        "",
    ],
})

df = source_df[source_df["conversation_id"] == conversation_id]

history = []

for _, row in df.iterrows():
    conv = Conversation(
        success=row["success"],
        input_prompt=row["input_prompt"],
        response_text=row["response_text"],
        reasoning=row["reasoning_steps"],
        mcp_tool_selected=row["mcp_tool_selected"],
        tool_selection_reasoning=row["tool_selection_reasoning"]
    )
    history.append(conv)


payload = LLMPayload(
    conversation_id= conversation_id,
    conversation_history=history
)

result = LLMService.call_llm(payload=payload)
print("\n")
print("#########")
print(f"{SCENARIOS[conversation_id]} scenario")
print("\n")
print("#########")
print(result)

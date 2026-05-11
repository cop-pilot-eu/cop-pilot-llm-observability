import pandas as pd
from src.models.llm_payload_model import Conversation, LLMPayload
from src.services.llm_service import LLMService

source_df = pd.DataFrame({ 
    "conversation_id": ["test-session-882", "test-session-882", "test-session-992", "test-session-882"],
    "success": ["TRUE", "TRUE", "TRUE", "FALSE"],
    "input_prompt": [
        "Translate Service Order #882: Enable 5G Network Slice for Sector A.",
        "Apply characteristics to Service Order #882: bandwidth=1Gbps, latency=10ms.",
        "Confirm and close Service Order #882.",
        "Reopen Service Order #882 and review the tools"
    ],
    "response_text": [
        "Parsed Service Order #882. Extracting characteristics for 5G Slicing.",
        "Configured VNF characteristics for 1Gbps bandwidth and 10ms latency.",
        "Service Order #882 transition to COMPLETED. All actions applied.",
        "Error: Service Order not found in OSL database."
    ],
    "reasoning_steps": [
        "['Analyzed OSL service catalog', 'Identified required slice parameters', 'Mapped to OSOM workflow']",
        "['Retrieved MCP context for VNF', 'Calculated resource allocation', 'Validated against SLA']", 
        "['Verified all agent tasks', 'Updated OSOM state machine', 'Finalized service order']",
        "[]"
    ],
    "mcp_tool_selected": ["catalog_lookup", "resource_provisioning", "workflow_update", ""],
    "tool_selection_reasoning": [
        "Querying local OSL catalog to find matching Service Specification.",
        "Invoking MCP server to interact with OpenStack/Kubernetes resource layer.",
        "Updating the state in the OSOM core after successful multi-agent coordination.",
        ""
    ]
})

conversation_id = "test-session-992" # or 992 for one input<>output pair
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
print(result)
<script setup lang="ts">
import { isNil } from "ramda";

const { AgentEventsAPI, loading: loadingAgent } = useAgentApi();
const { JudgementsAPI, loading: loadingJudge } = useJudgementsAPI();
const { handleError } = useErrorHandler();

const agents = ref<string[]>([]);
const agentMetrics = ref<AgentMetrics | undefined>(undefined);
const judgementMetrics = ref<JudgementMetrics | undefined>(undefined);
const successChart = ref<SuccessChartData[] | undefined>(undefined);
const agentEvents = ref<AgentEventHistory[] | undefined>(undefined);
const judgementResponse = ref<JudgementResponse | undefined>(undefined);

// Error Messages
const errorAgent = ref<string | undefined>(undefined);
const errorJudge = ref<string | undefined>(undefined);

onMounted(async (): Promise<void> => {
  try {
    const res: { agentIds: string[] } = await AgentEventsAPI.getAgents();
    agents.value = res.agentIds;
  } catch (err: unknown) {
    errorAgent.value = handleError(err);
  }
});

const loadAgentEvents = async (agentId: string): Promise<void> => {
  try {
    const res: AgentEventsResponse = await AgentEventsAPI.get(agentId);
    agentMetrics.value = res.metrics.agentMetrics;
    judgementMetrics.value = res.metrics.judgementMetrics;
    successChart.value = res.metrics.successChart;
    agentEvents.value = res.events;
    hideJudgement();
  } catch (err: unknown) {
    errorAgent.value = handleError(err);
  }
};

const currentJudgementUuid = ref<string | undefined>(undefined);
const showJudgement = async (judgementId: string): Promise<void> => {
  try {
    const res: JudgementResponse = await JudgementsAPI.get(judgementId);
    currentJudgementUuid.value = judgementId;
    judgementResponse.value = res;
  } catch (err: unknown) {
    errorJudge.value = handleError(err);
  }
};

const hideJudgement = (): void => {
  currentJudgementUuid.value = undefined;
};

const vote = async (isLike: boolean): Promise<void> => {
  if (isNil(currentJudgementUuid.value)) return;
  try {
    await JudgementsAPI.vote(currentJudgementUuid.value, isLike);
    if (isNil(currentJudgementUuid.value)) return;
    await showJudgement(currentJudgementUuid.value);
  } catch (err: unknown) {
    errorJudge.value = handleError(err);
  }
};
</script>

<template>
  <div class="overflow-y-auto overflow-x-hidden">
    <div class="space-y-6">
      <TargetLLM
        :agents="agents"
        :loading="loadingAgent"
        :error-message="errorAgent"
        :agent-metrics="agentMetrics"
        :judgement-metrics="judgementMetrics"
        @agentSelected="loadAgentEvents"
      />
      <History
        :success-chart="successChart"
        :loading="loadingAgent"
        :error-message="errorAgent"
      />
      <PromptEvaluation
        v-if="agentEvents && agentEvents.length > 0"
        :agent-events="agentEvents"
        :loading-agent="loadingAgent"
        :loading-judge="loadingJudge"
        :error-judge="errorJudge"
        :error-agent="errorAgent"
        @show-judgement="showJudgement"
        @hide-judgement="hideJudgement"
      />
      <JudgeLLM
        v-if="currentJudgementUuid"
        :loading="loadingJudge"
        :error-message="errorJudge"
        :status="judgementResponse?.status"
        :data="judgementResponse?.data"
        @vote="vote"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { isNil } from "ramda";

const props = defineProps({
  agents: {
    type: Array as () => string[],
    required: true,
    default: () => [],
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  errorMessage: {
    type: String,
    required: false,
    default: undefined,
  },
  agentMetrics: {
    type: Object as () => AgentMetrics | undefined,
    required: false,
    default: () => ({
      totalNumberOfCalls: undefined,
      avgInputTokens: undefined,
      avgLatencyMs: undefined,
      avgSuccessRate: undefined,
    }),
  },
  judgementMetrics: {
    type: Object as () => JudgementMetrics | undefined,
    required: false,
    default: () => ({
      avgAccuracy: undefined,
      avgRelevance: undefined,
      avgReasoningQuality: undefined,
      avgHallucination: undefined,
    }),
  },
});

const emits = defineEmits(["agentSelected"]);
const agent = ref<string | undefined>(undefined);

watch(
  () => props.agents,
  (newAgents) => {
    if (newAgents && newAgents.length > 0 && isNil(agent.value)) {
      agent.value = newAgents[0];
      emits("agentSelected", newAgents[0]);
    }
  },
  { immediate: true },
);

const getAgentMetrics = computed<Card[]>((): Card[] => {
  const data = { ...props.agentMetrics };

  return [
    {
      title: "Total Agent Calls",
      value: !isNil(data.totalNumberOfCalls)
        ? `${data.totalNumberOfCalls}`
        : null,
      icon: "lucide:messages-square",
    },
    {
      title: "Average Token Usage",
      value: !isNil(data.avgInputTokens) ? `${data.avgInputTokens}` : null,
      icon: "lucide:square-stack",
    },
    {
      title: "Average Response Rate",
      value: !isNil(data.avgSuccessRate)
        ? `${(data.avgSuccessRate * 100).toFixed(1)} %`
        : null,
      icon: "lucide:check-check",
    },
    {
      title: "Average Latency",
      value: !isNil(data.avgLatencyMs) ? `${data.avgLatencyMs} ms` : null,
      icon: "lucide:clock",
    },
  ];
});

const getJudgementMetrics = computed<Card[]>((): Card[] => {
  const data = [
    {
      title: "Average Accuracy",
      value: !isNil(props.judgementMetrics?.avgAccuracy)
        ? `${props.judgementMetrics.avgAccuracy} / 5`
        : null,
      icon: "lucide:goal",
    },
    {
      title: "Average Relevance",
      value: !isNil(props.judgementMetrics?.avgRelevance)
        ? `${props.judgementMetrics.avgRelevance} / 5`
        : null,
      icon: "lucide:search",
    },
    {
      title: "Average Reasoning Quality",
      value: !isNil(props.judgementMetrics?.avgReasoningQuality)
        ? `${props.judgementMetrics.avgReasoningQuality} / 5 `
        : null,
      icon: "lucide:lightbulb",
    },

    {
      title: "Average Hallucination Rate",
      value: !isNil(props.judgementMetrics?.avgHallucination)
        ? `${(props.judgementMetrics.avgHallucination * 20).toFixed(2)} %`
        : null,
      icon: "lucide:ghost",
    },
  ];
  return data;
});

const agentUpdated = (newAgent: string) => {
  emits("agentSelected", newAgent);
};
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="space-y-4">
        <p class="text-2xl font-semibold">Target Agent (Responder)</p>
        <div v-if="!errorMessage" class="flex justify-between">
          <USelect
            v-model="agent"
            :items="agents"
            class="w-1/2 h-fit"
            :ui="{
              trailingIcon:
                'group-data-[state=open]:rotate-180 transition-transform duration-200',
            }"
            :loading="loading"
            loading-icon="i-lucide-loader"
            @update:modelValue="agentUpdated"
          />
        </div>
      </div>
      <div class="flex space-x-2">
        <Card
          v-for="(value, index) in getAgentMetrics"
          :key="index"
          :card="value"
          :loading="loading"
          :error="errorMessage"
        />
      </div>

      <div class="flex space-x-2">
        <Card
          v-for="(value, index) in getJudgementMetrics"
          :key="index"
          :card="value"
          :loading="loading"
          :error="errorMessage"
        />
      </div>
    </div>
  </div>
</template>

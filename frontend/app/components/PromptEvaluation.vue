<script setup lang="ts">
import { isNil, prop, sortBy } from "ramda";

const props = defineProps({
  loadingAgent: {
    type: Boolean,
    required: false,
    default: false,
  },
  loadingJudge: {
    type: Boolean,
    required: false,
    default: false,
  },
  errorAgent: {
    type: String,
    required: false,
    default: undefined,
  },
  errorJudge: {
    type: String,
    required: false,
    default: undefined,
  },
  agentEvents: {
    type: Array as () => AgentEventHistory[] | undefined,
    required: false,
    default: undefined,
  },
});

const emits = defineEmits(["show-judgement", "hide-judgement"]);

// Filter for (desc) sorting array based on "timestamp" value of objects
const oldestFirst = sortBy(prop("timestamp"));

const emittedOptionJudgeId = ref<string | undefined>(undefined);
const selectedOption = ref<string | undefined>(undefined);

const showJudgement = () => {
  if (isNil(selectedPrompt.value) || isNil(selectedPrompt.value.judgement.id))
    return;

  emits("show-judgement", selectedPrompt.value.judgement.id);
  emittedOptionJudgeId.value = selectedPrompt.value.judgement.id;
};

const sortedAgentEvents = computed(() => {
  if (!props.agentEvents) return [];
  return props.agentEvents.map((agentEvent) => ({
    ...agentEvent,
    events: oldestFirst(agentEvent.events),
  }));
});

const prompts = computed<{ value: string; label: string }[]>(() => {
  return sortedAgentEvents.value.reduce(
    (
      acc: { value: string; label: string }[],
      conversation: AgentEventHistory,
    ) => {
      if (conversation.events.length > 0) {
        const event = conversation.events[0] as AgentEvent;
        acc.push({
          value: conversation.conversationId,
          label:
            event.inputPrompt.substring(0, 50) +
            (event.inputPrompt.length > 50 ? "..." : ""),
        });
      }
      return acc;
    },
    [],
  );
});

watch(
  () => props.agentEvents,
  () => {
    selectedOption.value = prompts.value[0]?.value;
  },
  { immediate: true },
);

const selectedPrompt = computed(() => {
  if (sortedAgentEvents.value.length === 0) return undefined;

  const optionId = selectedOption.value ?? prompts.value[0]?.value;

  const selectionResult = sortedAgentEvents.value.filter(
    (e) => e.conversationId === optionId,
  )[0];

  if (selectionResult?.judgement.id !== emittedOptionJudgeId.value) {
    emittedOptionJudgeId.value = undefined;
    emits("hide-judgement", emittedOptionJudgeId.value);
  }

  return selectionResult;
});

const changePrompt = computed(() => {
  return selectedPrompt.value?.judgement.id === emittedOptionJudgeId.value;
});
</script>

<template>
  <div
    class="p-4 my-4 rounded-md shadow-xl border-2 border-primary-600 bg-secondary-200 flex flex-col space-y-4"
  >
    <div class="font-semibold text-xl py-2 text-neutral-400">
      <p>Conversation Evaluation</p>
    </div>

    <div v-if="!errorAgent && !errorJudge" class="flex flex-col space-y-4 w-full">
      <div class="flex flex-col space-y-1 w-1/3">
        <label class="text-xs text-neutral-400/80">Choose a conversation to inspect</label>
        <USelect
          v-model="selectedOption"
          :items="prompts"
          placeholder="Select Prompt"
          class="h-fit w-full truncate whitespace-pre-wrap"
          :loading="loadingAgent"
          loading-icon="i-lucide-loader"
          :ui="{
            trailingIcon:
              'group-data-[state=open]:rotate-180 transition-transform duration-200',
            itemLabel: 'truncate whitespace-pre-wrap',
          }"
        />
      </div>

      <div class="flex flex-col space-y-4 w-full" v-if="selectedPrompt">
        <div class="flex items-center space-x-4 text-xs text-neutral-400/80">
          <div class="flex items-center space-x-1">
            <UIcon name="material-symbols:build-circle" class="size-4 text-primary-600" />
            <span>User Input — what the user asked</span>
          </div>
          <div class="flex items-center space-x-1">
            <UIcon name="ic:sharp-psychology" class="size-4 text-primary-600" />
            <span>Agent Reasoning — the agent's response</span>
          </div>
        </div>

        <UScrollArea class="h-96 w-full" :ui="{ viewport: 'gap-4 pr-4' }">
          <div
            class="space-y-4"
            v-for="(event, index) in selectedPrompt.events"
            :key="index"
          >
            <div class="flex">
              <UTooltip
                :delay-duration="0"
                arrow
                :content="{
                  side: 'top',
                }"
                text="User Prompt"
              >
                <UIcon
                  name="material-symbols:build-circle"
                  class="size-12 text-primary-600"
                />
              </UTooltip>

              <div
                class="bg-primary-600 text-secondary-100 p-4 rounded-lg shadow-sm flex-1"
              >
                <p>
                  {{ event.inputPrompt }}
                </p>
              </div>
            </div>
            <div class="flex">
              <UTooltip
                :delay-duration="0"
                arrow
                :content="{
                  side: 'top',
                }"
                text="Response"
              >
                <UIcon
                  name="ic:sharp-psychology"
                  class="size-12 text-primary-600"
                />
              </UTooltip>
              <div
                class="bg-primary-700 text-secondary-100 p-4 rounded-lg shadow-sm flex-1"
              >
                <p>
                  {{ event.responseText }}
                </p>
              </div>
            </div>
          </div>
        </UScrollArea>
        <div
          class="flex flex-col w-1/3 justify-center items-center mx-auto space-y-2 pt-4 pb-1"
        >
          <UIcon name="material-symbols:gavel" class="size-36 text-gray-600" />
          <UButton
            color="secondary"
            @click="showJudgement"
            :disabled="!selectedPrompt"
            >Show Judgement</UButton
          >
          <p class="text-xs text-neutral-400/80 text-center">
            Sends this conversation to the judge model, which scores accuracy,
            relevance, and reasoning quality.
          </p>
          <div
            v-if="loadingJudge"
            class="flex items-center w-fit space-x-4 justify-center"
          >
            <div>
              <LoadingSpinner height="h-10" />
            </div>
            <div class="flex-1 font-semibold text-primary-600">
              <p>Evaluation in progress...</p>
            </div>
          </div>
          <div v-else class="h-4"></div>
        </div>
      </div>
    </div>

    <div v-else>
      <ErrorBanner v-if="errorAgent" :message="errorAgent" />
      <ErrorBanner v-if="errorJudge" :message="errorJudge" />
    </div>
  </div>
</template>

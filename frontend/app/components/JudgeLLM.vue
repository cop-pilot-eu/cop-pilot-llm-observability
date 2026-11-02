<script setup lang="ts">
import { isNil } from "ramda";

const props = defineProps({
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
  data: {
    type: Object as PropType<JudgementResultData>,
    required: true,
    default: {},
  },
  status: {
    type: String,
    required: false,
    default: "PENDING",
    validator(value: string) {
      return ["PENDING", "FAILED", "COMPLETED"].includes(value);
    },
  },
});

const emits = defineEmits(["vote"]);
const vote = (isLike: boolean) => {
  if (props.data.userVote === isLike) return;
  emits("vote", isLike);
};

const cardData = computed<Card[]>((): Card[] => {
  return [
    {
      title: "Factual Accuracy",
      value: isNil(props.data.accuracy) ? null : `${props.data.accuracy} / 5 `,
      icon: "lucide:goal",
    },
    {
      title: "Relevance",
      value: isNil(props.data.relevance)
        ? null
        : `${props.data.relevance} / 5 `,
      icon: "lucide:search",
    },
    {
      title: "Reasoning Quality",
      value: isNil(props.data.reasoningQuality)
        ? null
        : `${props.data.reasoningQuality} / 5 `,
      icon: "lucide:brain",
    },
    {
      title: "Hallucination Detection",
      value: isNil(props.data.hallucination)
        ? null
        : props.data.hallucination
          ? "Yes"
          : "No",
      icon: "lucide:ghost",
    },
  ];
});

// todo: average response time
const averageResponseTime = computed(() => {
  return !isNil(props.data?.averageLatencyMs)
    ? props.data?.averageLatencyMs
    : null;
});

const hasVotePositive = computed<boolean>(() => {
  return isNil(props.data.userVote) ? false : props.data.userVote === true;
});
const hasVoteUndefined = computed<boolean>(() => {
  return isNil(props.data.userVote) ? true : false;
});

const evaluationResponse = computed(() => {
  return props.data.output ?? "Not available";
});
</script>

<template>
  <div>
    <div class="font-semibold text-2xl py-4 text-neutral-400 text-center">
      <p>Judge LLM (Evaluator)</p>
    </div>

    <div
      v-if="!errorMessage"
      class="p-4 my-4 rounded-md shadow-xl bg-primary-700"
    >
      <div class="py-2 text-secondary-100 flex flex-col space-y-4">
        <p class="font-semibold text-lg text-secondary-50">JUDGEMENT REPORT</p>

        <div class="flex-1">
          <div v-if="!loading">
            <p class="font-semibold">
              EVALUATION OF TARGET LLM RESPONSE (Overall Impression):
            </p>
            <p class="italic py-2 px-4 bg-neutral-300 rounded-md my-2">
              {{ evaluationResponse }}
            </p>
          </div>
          <div v-else class="flex flex-col space-y-2">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-full" />
          </div>
        </div>

        <div class="flex space-x-2 text-primary-700">
          <Card
            v-for="(value, index) in cardData"
            :key="index"
            :card="value"
            :loading="loading"
            :error="errorMessage"
          />
        </div>

        <div class="flex justify-end space-x-2 p-2">
          <UIcon
            name="prime:thumbs-up"
            class="size-6 hover:bg-primary-200 hover:scale-125"
            :class="
              !hasVoteUndefined && hasVotePositive ? 'bg-primary-400' : ''
            "
            @click="vote(true)"
          />

          <UIcon
            name="prime:thumbs-down"
            class="size-6 hover:bg-primary-300 hover:scale-125"
            :class="
              !hasVoteUndefined && !hasVotePositive ? 'bg-primary-400' : ''
            "
            @click="vote(false)"
          />
        </div>
      </div>
    </div>

    <ErrorBanner v-if="errorMessage" :message="errorMessage" />

    <div
      v-if="averageResponseTime && !errorMessage"
      class="flex justify-end px-4 font-semibold text-sm text-neutral-400"
    >
      <p>Avg Response: {{ averageResponseTime }} ms</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isNil } from "ramda";

const props = defineProps({
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  card: {
    type: Object as PropType<Card>,
    required: true,
  },
  error: {
    type: String,
    required: false,
    default: undefined,
  },
});

const hasError = computed(() => !isNil(props.error));
</script>

<template>
  <div class="flex items-center flex-1">
    <div class="h-4/5 w-1 relative left-0.5 bg-primary-400" />
    <div
      class="w-full px-6 py-2 space-y-1 border border-neutral-300 rounded-md bg-secondary-200"
    >
      <div
        v-if="!loading && !hasError"
        class="flex justify-between text-neutral-400 items-center"
      >
        <div class="text-lg font-medium">{{ card.title }}</div>
        <Icon :name="card.icon" class="size-4" />
      </div>
      <USkeleton
        v-else
        class="bg-neutral-100 h-4 w-full"
        :class="hasError ? 'bg-error-50' : 'bg-neutral-100'"
      />

      <div v-if="!loading && !hasError" class="text-2xl font-semibold">
        <span v-if="card.value !== null">
          {{ card.value }}
        </span>
        <span v-else class="text-yellow-600 italic text-sm font-bold">
          Not Applicable
        </span>
      </div>
      <USkeleton
        v-else
        class="h-8 w-full"
        :class="hasError ? 'bg-error-50' : 'bg-neutral-100'"
      />
    </div>
  </div>
</template>

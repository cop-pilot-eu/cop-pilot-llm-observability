<script setup lang="ts">
defineProps({
  height: {
    type: String,
    required: false,
    default: "h-75",
  },
  message: {
    type: String,
    required: false,
    default: undefined,
  },
});
</script>
<template>
  <div
    :class="[
      'w-full flex flex-col justify-center items-center border-2 border-error-500 bg-error-200 rounded-xl text-error-800',
      `${height}`,
    ]"
  >
    <p class="text-xl font-semibold">{{ message }}</p>
    <p class="text-sm">Please reload the page</p>
  </div>
</template>

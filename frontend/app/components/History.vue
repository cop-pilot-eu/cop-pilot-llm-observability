<script setup lang="ts">
const props = defineProps({
  successChart: {
    type: Array as () => SuccessChartData[],
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
});

const chartOptions = computed(() => {
  const dataFormatted = groupChartData(props.successChart, chartPeriod.value);

  return {
    // Define colors to match your image (Dark Navy and Royal Blue)
    color: ["#0A2351", "#0D47A1"],

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },

    legend: {
      data: ["Success", "Fail"],
      top: "top",
      icon: "circle",
    },

    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },

    xAxis: {
      type: "category",
      data: dataFormatted.map((item) => item.period),
      axisLine: { lineStyle: { color: "#ccc" } },
      axisTick: { show: false },
    },

    yAxis: {
      type: "value",
      min: 0,
      interval: 1,
      splitLine: { lineStyle: { type: "solid", color: "#f0f0f0" } },
    },

    series: [
      {
        name: "Success",
        type: "bar",
        barGap: 0, // space between bars
        label: {
          show: true,
          position: "inside",
          color: "#fff",
        },
        data: dataFormatted.map((item) => +item.success),
      },
      {
        name: "Fail",
        type: "bar",
        label: {
          show: true,
          position: "inside",
          color: "#fff",
        },
        data: dataFormatted.map((item) => item.failure),
      },
    ],
  };
});

const chartPeriod = ref<GroupingType>("day");
const chartPeriodOptions: GroupingType[] = ["day", "week", "month"];
</script>

<template>
  <div
    class="p-4 my-4 rounded-md shadow-xl border-2 border-primary-600 bg-secondary-200"
  >
    <div class="py-2 text-neutral-400 flex justify-between">
      <p class="font-semibold text-xl text-neutral-400">Response History</p>
      <div
        v-if="!errorMessage"
        class="flex space-x-4 text-md w-1/5 items-center"
      >
        <p>Group data by</p>
        <USelect
          v-model="chartPeriod"
          :items="chartPeriodOptions"
          class="w-1/2 h-fit"
        />
      </div>
    </div>
    <div v-if="!loading && !errorMessage" class="flex h-75">
      <VChart :option="chartOptions" />
    </div>
    <LoadingSpinner v-if="loading" />
    <ErrorBanner v-if="errorMessage" :message="errorMessage" />
  </div>
</template>

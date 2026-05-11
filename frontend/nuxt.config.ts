// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: {
    port: 3000,
  },

  app: {
    head: {
      title: "COP Pilot LLM",
      meta: [
        {
          name: "COP Pilot LLM",
          content: "COP Pilot LLM application.",
        },
      ],
      // link: [{ rel: "icon", type: "image/x-icon", href: "/img/favicon.ico" }],
    },
  },

  modules: ["@nuxt/ui", "nuxt-echarts"],
  css: ["~/assets/css/main.css"],
  colorMode: {
    preference: "light",
    fallback: "light",
    classSuffix: "",
    storage: "cookie",
  },

  ui: {
    theme: {
      colors: [
        "primary",
        "secondary",
        "tertiary",
        "success",
        "negative",
        "error",
      ],
    },
  },

  echarts: {
    charts: ["BarChart"],
    components: [
      "DatasetComponent",
      "GridComponent",
      "TooltipComponent",
      "LegendComponent",
      "TitleComponent",
    ],
  },

  runtimeConfig: {
    backendUrl: "",
  },
});

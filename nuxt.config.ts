// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  // ssr: false,

  runtimeConfig: {
    apiBaseUrl: process.env.NUXT_API_BASE_URL,
    authRequestHeaderKey: process.env.NUXT_AUTH_REQUEST_HEADER_KEY,
    authRequestHeaderValue: process.env.NUXT_AUTH_REQUEST_HEADER_VALUE,
    public: {
      // apiBaseUrl: "",
      // TODO: probabilmente possono essere eliminati
      // authRequestHeaderKey: process.env.AUTH_HEADER_KEY,
      // authRequestHeaderValue: process.env.AUTH_HEADER_VALUE,
      // requestHeaders: {
      //   [`${process.env.AUTH_HEADER_KEY}`]: process.env.AUTH_HEADER_VALUE,
      // },
      // TODO: inutilizzato
      maxSeatsPerOrder: process.env.MAX_SEATS_PER_ORDER,
    },
  },

  modules: [
    "@pinia/nuxt",
    [
      "@vee-validate/nuxt",
      {
        // disable or enable auto imports
        autoImports: true,
      },
    ],
    "nuxt3-date-fns",
  ],

  pinia: {
    autoImports: [
      // automatically imports `defineStore`
      "defineStore", // import { defineStore } from 'pinia'
      ["defineStore", "definePiniaStore"], // import { defineStore as definePiniaStore } from 'pinia'
      "storeToRefs",
    ],
  },

  css: [
    "primevue/resources/themes/lara-light-blue/theme.css",
    // "primevue/resources/themes/aura-light-blue/theme.css",
    "primevue/resources/primevue.css",
    "primeicons/primeicons.css",
    "primeflex/primeflex.css",
    "@/assets/css/theme-lara.css",
    "@/assets/css/main.css",
  ],

  build: {
    transpile: ["primevue"],
  },

  routeRules: {},
  compatibilityDate: "2024-08-19",
});

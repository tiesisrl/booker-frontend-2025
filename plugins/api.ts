export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    onRequest({ request, options, error }) {
      const headers = (options.headers ||= {});

      if (Array.isArray(headers)) {
        headers.push(["Authorization", config.public.authRequestHeaderValue]);
      } else if (headers instanceof Headers) {
        headers.set("Authorization", config.public.authRequestHeaderValue);
      } else {
        headers.Authorization = config.public.authRequestHeaderValue;
      }
    },
  });

  return {
    provide: {
      api,
    },
  };
});

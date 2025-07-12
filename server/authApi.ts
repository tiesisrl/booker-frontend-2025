const config = useRuntimeConfig();

export default $fetch.create({
  baseURL: config.apiBaseUrl,
  onRequest({ request, options, error }) {
    const headers = (options.headers ||= {});

    if (Array.isArray(headers)) {
      headers.push(["Authorization", config.authRequestHeaderValue]);
    } else if (headers instanceof Headers) {
      headers.set("Authorization", config.authRequestHeaderValue);
    } else {
      headers.Authorization = config.authRequestHeaderValue;
    }
  },
});

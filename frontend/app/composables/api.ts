import type { NitroFetchRequest } from "nitropack";
import type { FetchOptions } from "ofetch";

export interface ApiState {
  pendingRequests: Ref<number>;
  error: Ref<Error | undefined>;
}

export const useAPI = (externalState?: ApiState) => {
  const pendingRequests = externalState?.pendingRequests ?? ref<number>(0);
  const error = externalState?.error ?? ref<Error | undefined>();
  const loading = computed(() => pendingRequests.value > 0);

  const API = <T = any>(url: string, options?: FetchOptions) => {
    const headers: HeadersInit = {
      Accept: "application/json",
      "Cache-control": "no-cache",
      ...options?.headers,
    };

    const opts: FetchOptions = options
      ? (({ headers, ...opts }) => opts)({ ...options })
      : {};

    const fetch = $fetch.create<T, NitroFetchRequest>({
      baseURL: options?.baseURL,
      signal: AbortSignal.timeout(60000), // 1 min  timeout
      headers,
      ...opts,
      onRequest: (_ctx) => {
        pendingRequests.value += 1;
        error.value = undefined;
      },
      onResponse: (_ctx) => {
        pendingRequests.value -= 1;
      },
      onRequestError: (ctx) => {
        error.value = ctx.error;
      },
    });

    return fetch<T>(url);
  };

  const $api = {
    get: <T = any>(url: string, opts?: FetchOptions) =>
      API<T>(url, { method: "GET", ...opts }),
    post: <T = any>(url: string, body?: any, opts?: FetchOptions) =>
      API<T>(url, { method: "POST", body, ...opts }),
    put: <T = any>(url: string, body?: any, opts?: FetchOptions) =>
      API<T>(url, { method: "PUT", body, ...opts }),
    patch: <T = any>(url: string, body?: any, opts?: FetchOptions) =>
      API<T>(url, { method: "PATCH", body, ...opts }),
    delete: <T = any>(url: string, opts?: FetchOptions) =>
      API<T>(url, { method: "DELETE", ...opts }),
  };

  return {
    $api,
    loading,
    error,
  };
};

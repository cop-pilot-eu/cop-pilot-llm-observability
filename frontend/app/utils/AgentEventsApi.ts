export const useAgentApi = () => {
  const state: ApiState = {
    pendingRequests: ref(0),
    error: ref<Error | undefined>(),
  };
  const { $api, loading, error } = useAPI(state);

  const AgentEventsAPI = {
    getAgents: () => $api.get("/api/agent-events/agents"),
    get: (id: string) => $api.get(`/api/agent-events/agent/${id}`),
  };

  return {
    AgentEventsAPI,
    loading,
    error,
  };
};

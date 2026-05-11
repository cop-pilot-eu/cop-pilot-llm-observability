export const useJudgementsAPI = () => {
  const state: ApiState = {
    pendingRequests: ref(0),
    error: ref<Error | undefined>(),
  };
  const { $api, loading, error } = useAPI(state);

  const JudgementsAPI = {
    get: (id: string) => $api.get(`/api/judgements/${id}`),
    vote: (id: string, isLike: boolean) =>
      $api.patch(`/api/judgements/${id}/vote`, {
        isLike: isLike,
      }),
  };

  return {
    JudgementsAPI,
    loading,
    error,
  };
};

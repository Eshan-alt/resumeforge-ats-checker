import { useQueryClient } from "@tanstack/react-query"
import { getListAnalysesQueryKey, getGetAnalysisQueryKey, useCreateAnalysis } from "@workspace/api-client-react"

export function useCreateAnalysisMutation() {
  const queryClient = useQueryClient()
  return useCreateAnalysis({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() })
        if (data?.id) {
          queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(data.id) })
        }
      }
    },
  })
}

import { client } from "@/lib/hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  typeof client.api.summary.generateAnalysis.$post
>;
type RequestType = InferRequestType<
  typeof client.api.summary.generateAnalysis.$post
>["json"];

export const useGetAnalysis = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.summary.generateAnalysis.$post({
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to generate analysis");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Analysis generated successfully");
      queryClient.invalidateQueries({ queryKey: ["analysis"] });
    },
    onError: () => {
      toast.error("Failed to generate analysis");
    },
  });

  return mutation;
};

import { useAccount } from "@/hooks/useAccount";
import { client } from "@/lib/hono";
import { convertAmountFromMiliUnits } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export const useGetSummary = () => {
  const params = useSearchParams();
  const { accountId: accountIdState } = useAccount();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = accountIdState || params.get("accountId") || "";
  const query = useQuery({
    queryKey: ["summary", { from, to, accountId }],
    queryFn: async () => {
      const response = await client.api.summary.$get({
        query: {
          from,
          to,
          accountId,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch summary");
      const { data } = await response.json();
      return {
        ...data,
        incomeAmount: convertAmountFromMiliUnits(data.incomeAmount),
        expenseAmount: convertAmountFromMiliUnits(data.expenseAmount),
        remainingAmount: convertAmountFromMiliUnits(data.remainingAmount),
        categories: data.categories.map((category) => ({
          ...category,
          value: convertAmountFromMiliUnits(category.value),
        })),
        days: data.days.map((day) => ({
          ...day,
          income: convertAmountFromMiliUnits(day.income),
          expenses: convertAmountFromMiliUnits(day.expenses),
        })),
      };
    },
  });
  return query;
};

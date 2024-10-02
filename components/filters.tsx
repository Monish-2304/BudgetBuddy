"use client";
import { useGetSummary } from "@/features/summary/api/use-get-summary";
import AccountFilter from "./account-filter";
import DateFilter from "./date-filter";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { useGetAnalysis } from "@/features/summary/api/use-get-analysis";
import { useAnalysis } from "@/hooks/useAnalysis";

const Filters = () => {
  const { data } = useGetSummary();
  const pathName = usePathname();
  const setAnalysisResult = useAnalysis((state) => state.setAnalysisResult);
  const setLoading = useAnalysis((state) => state.setLoading);
  const { mutateAsync: generateAnalysisApi, isPending } = useGetAnalysis();

  const generateAnalysis = async () => {
    if (data) {
      try {
        setLoading(true);
        const result = await generateAnalysisApi(data);
        if ("analysisResult" in result && result.analysisResult) {
          const rawText =
            result.analysisResult.response.candidates[0].content.parts[0].text;
          const parsedText = JSON.parse(rawText);
          setAnalysisResult(parsedText);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to generate analysis:", error);
      }
    }
  };
  return (
    <div className="flex flex-col lg:flex-row items-center gap-y-2 lg:gap-y-0 lg:gap-x-2">
      <AccountFilter />
      <DateFilter />
      {pathName === "/analysis" && (
        <Button onClick={generateAnalysis} disabled={isPending}>
          Generate Analysis
        </Button>
      )}
    </div>
  );
};

export default Filters;

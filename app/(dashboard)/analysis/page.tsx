"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Loader2 } from "lucide-react";

const Analysis = () => {
  const analysisResult = useAnalysis((state) => state.analysisResult);
  const loading = useAnalysis((state) => state.loading);
  if (loading) {
    return (
      <div className="w-full pb-10 -mt-20">
        <Card className=" border-none drop-shadow-sm">
          <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center">
              <Loader2 className="size-6 text-slate-500 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="w-full pb-10 -mt-20 rounded-lg">
      <Card className=" border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className=" text-xl line-clamp-1">Analysis Page</CardTitle>
        </CardHeader>
        <CardContent>
          {analysisResult ? (
            <div>
              <div className="my-2">
                <h3 className="font-semibold text-lg text-blue-500">
                  Detailed Analysis
                </h3>
                <p className=" font-normal">{analysisResult?.analysis}</p>
              </div>
              <div className="my-2">
                <h3 className="font-semibold text-lg text-blue-500">
                  Key Points
                </h3>
                <ul className="list-disc ml-5">
                  {analysisResult?.key_points.map(
                    (insight: string, index: number) => (
                      <li key={index}>{insight}</li>
                    )
                  )}
                </ul>
              </div>
              <div className="my-2">
                <h3 className="font-semibold text-lg text-blue-500">Rating</h3>{" "}
                <p className=" font-normal capitalize">
                  {analysisResult?.rating}
                </p>
              </div>
              <div className="my-2">
                <h3 className="font-semibold text-lg text-blue-500">
                  Suggested Improvements
                </h3>{" "}
                <ul className="list-disc ml-5">
                  {analysisResult?.suggested_improvements.map(
                    (insight: string, index: number) => (
                      <li key={index}>{insight}</li>
                    )
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <p className="font-semibold text-lg">Generate your Analysis Now!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analysis;

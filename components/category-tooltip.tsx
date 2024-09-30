import { format } from "date-fns";

import { formatCurrency } from "@/lib/utils";
import { Separator } from "./ui/separator";

const CategoryToolTip = ({ active, payload }: any) => {
  if (!active) return null;

  const name = payload[0].payload.name;
  const value = payload[0].value;

  return (
    <div className="rounded-sm bg-white shadow-sm border overflow-hidden">
      <div className="text-sm p-2 px-3 bg-muted text-muted-foreground">
        {name}
      </div>
      <Separator />
      <div className=" p-2 px-3 space-y-1 w-40">
        <div className="flex items-center justify-between gap-x-8">
          <div className="flex items-center justify-between gap-x-2">
            <div className="flex items-center size-1.5 bg-rose-500 rounded-full">
              <p className="ml-2 text-sm text-muted-foreground">Expenses</p>
            </div>
          </div>
          <p className="text-sm text-right font-medium">
            {formatCurrency(value)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryToolTip;

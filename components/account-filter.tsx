"use client";
import qs from "query-string";
import { Select, SelectContent, SelectItem, SelectValue } from "./ui/select";
import { SelectTrigger } from "@radix-ui/react-select";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { ChevronDown } from "lucide-react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { useAccount } from "@/hooks/useAccount";

const AccountFilter = () => {
  const router = useRouter();
  const pathName = usePathname();
  const params = useSearchParams();
  const { accountId: accountIdState, onChange: onAccountChange } = useAccount();
  const accountId = accountIdState || params.get("accountId") || "all";
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const onChange = (newValue: string) => {
    onAccountChange(newValue);
    const query = {
      accountId: newValue,
      from,
      to,
    };
    if (newValue === "all") {
      query.accountId = "";
      onAccountChange("");
    }
    const url = qs.stringifyUrl(
      {
        url: pathName,
        query,
      },
      { skipNull: true, skipEmptyString: true }
    );

    router.push(url);
  };

  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();
  const { isLoading: isLoadingSummary } = useGetSummary();
  return (
    <Select
      value={accountId}
      onValueChange={onChange}
      disabled={isLoadingAccounts || isLoadingSummary}
    >
      <SelectTrigger className="lg:w-auto w-full h-9 rounded-md px-3 font-normal bg-white/10 hover:bg-white/20 hover:text-white border-none focus:ring-offset-0 focus:ring-transparent outline-none text-white focus:bg-white/30 transition flex justify-between items-center gap-x-3">
        <SelectValue placeholder="Select Account" />
        <ChevronDown className="size-4 text-white" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Accounts</SelectItem>
        {accounts?.map((account) => (
          <SelectItem
            className=" capitalize"
            key={account.id}
            value={account.id}
          >
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AccountFilter;

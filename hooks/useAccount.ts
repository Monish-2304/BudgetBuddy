import { create } from "zustand";

type AccountState = {
  accountId: string;
  onChange: (id: string) => void;
};
export const useAccount = create<AccountState>((set) => ({
  accountId: "",
  onChange: (id: string) => set({ accountId: id }),
}));

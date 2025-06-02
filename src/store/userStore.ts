import { create } from "zustand";
import type { UserInfo } from "../types/user";

interface UserState {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo) => void;
}

const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  setUserInfo: (info) => set({ userInfo: info }),
}));

export default useUserStore;
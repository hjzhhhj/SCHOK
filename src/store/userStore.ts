import { create } from "zustand";
import type { UserInfo } from "../types/user";

// 사용자 상태를 정의하는 인터페이스
interface UserState {
  userInfo: UserInfo | null; // 사용자 정보 (초기값은 null)
  setUserInfo: (info: UserInfo) => void; // 사용자 정보를 설정하는 함수
}

// Zustand 스토어 생성
const useUserStore = create<UserState>((set) => ({
  userInfo: null, // 초기 사용자 정보는 없음
  // setUserInfo 함수: 인자로 받은 info 객체로 userInfo 상태 업데이트
  setUserInfo: (info) => set({ userInfo: info }),
}));

export default useUserStore;
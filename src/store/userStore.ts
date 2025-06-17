// useUserStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"; // persist와 createJSONStorage 불러오기
import type { UserInfo } from "../types/user";

// 사용자 상태를 정의하는 인터페이스
interface UserState {
  userInfo: UserInfo | null; // 사용자 정보 (초기값은 null)
  setUserInfo: (info: UserInfo) => void; // 사용자 정보를 설정하는 함수
}

// Zustand 스토어 생성 및 persist 미들웨어 적용
const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null, // 초기 사용자 정보는 없음
      // setUserInfo 함수: 인자로 받은 info 객체로 userInfo 상태 업데이트
      setUserInfo: (info) => set({ userInfo: info }),
    }),
    {
      name: "user-storage", // 로컬 스토리지에 저장될 때 사용될 키 이름
      storage: createJSONStorage(() => localStorage), // 로컬 스토리지 사용 지정
    }
  )
);

export default useUserStore;
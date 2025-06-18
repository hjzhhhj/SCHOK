// 사용자(학생)의 학교, 학년, 반, 번호, 집 주소 정보를 입력받아 저장하는 컴포넌트

import { useState } from "react";
import styled from "styled-components";
import useUserStore from "../store/userStore"; // 사용자 정보 관리 스토어
import type { UserInfo } from "../types/user"; // 사용자 정보 타입
import { SCHOOL_CODE_MAP } from "../utils/schoolCodeMap"; // 학교 코드와 좌표 매핑 데이터

// --- 스타일 컴포넌트 정의 ---
const Container = styled.div`
    width: auto;
    min-width: 300px;
    margin: 0px 50px 0px 50px;
    padding: 18px;
    border-radius: 16px;
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    font-family: "Pretendard";
    min-height: 70px;
    overflow: hidden;
`;

const Title = styled.h1`
    padding-left: 12px;
    font-size: 22px;
    font-family: "Jua";
    font-weight: 400;
    color: #007acc;
`;

const Input = styled.input`
    width: 50%;
    min-width: 120px;
    padding: 12px;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid #a0d9ff;
    background-color: #ffffff;
    &:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.2);
    }
`;

const InputHome = styled.input`
    width: 100%;
    min-width: 200px;
    padding: 12px;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid #a0d9ff;
    background-color: #ffffff;
    &:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.2);
    }
`

const Select = styled.select`
    width: 100%;
    min-width: 120px;
    padding: 12px;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid #a0d9ff;
    background-color: #ffffff;
    &:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.2);
    }
`;

const Button = styled.button`
    padding: 12px 20px;
    background-color: #007acc;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    white-space: nowrap;
    flex-shrink: 0;
    &:hover {
        background-color: #005f99;
    }
`;

const ResetButton = styled.button`
    padding: 12px 20px;
    background-color:#506482;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    white-space: nowrap;
    flex-shrink: 0;
    &:hover {
        background-color:#354154;
    }
`;

const FormWrapper = styled.div<{ $isOpen: boolean }>
`
    margin-left: 50px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    overflow: hidden;
    max-width: ${props => (props.$isOpen ? 'fit-content' : '0px')};
    opacity: ${props => (props.$isOpen ? '1' : '0')};
    transition: max-width 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease-in-out;
    flex-wrap: nowrap;
    flex-shrink: 0;

    ${props => !props.$isOpen && `
        pointer-events: none;
        visibility: hidden;
    `}
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;
`;

const ToggleButton = styled.button`
    background-color: transparent;
    color: #009fe3;
    padding: 8px 12px;
    font-size: 18px;
    font-weight: bold;
    flex-shrink: 0;
    margin-left: auto;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease, color 0.3s ease;
    &:hover {
        background-color: #e6f7ff;
        color: #007bb6;
    }
`;

// --- 상수 데이터 ---
const GRADE_LIST = [1, 2, 3];
const SCHOOL_LIST = Object.keys(SCHOOL_CODE_MAP);

// --- SetupPage 컴포넌트 ---
const SetupPage: React.FC = () => {
  const { userInfo, setUserInfo } = useUserStore(); // 전역 사용자 정보와 설정 함수 가져오기
  
  // 폼 초기 상태를 Zustand 스토어의 userInfo 값으로 설정
  const [form, setForm] = useState<Partial<UserInfo>>({
    school: userInfo?.school || "",
    grade: userInfo?.grade || undefined,
    classNum: userInfo?.classNum || undefined,
    studentNum: userInfo?.studentNum || undefined,
    homeAddress: userInfo?.homeAddress || "",
  });
  
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false); // 폼 확장/축소 상태

  // 입력 필드 값 변경 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // 학년, 반, 번호는 숫자로 변환하고 0 이하일 경우 undefined로 설정
    if (name === "grade" || name === "classNum" || name === "studentNum") {
      const parsedValue = parseInt(value);
      if (isNaN(parsedValue) || parsedValue <= 0) {
        setForm((prev) => ({
          ...prev,
          [name]: undefined,
        }));
        return;
      }
      setForm((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    } else {
      // 그 외 필드는 그대로 값 저장
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = () => {
    // 필수 입력 필드 유효성 검사
    if (
      form.school &&
      form.grade &&
      form.classNum &&
      form.studentNum
    ) {
      // 선택된 학교의 좌표 정보 가져오기
      const selectedSchool = SCHOOL_CODE_MAP[form.school];
      if (!selectedSchool) {
        alert("유효하지 않은 학교입니다.");
        return;
      }

      // 저장할 사용자 정보 객체 생성
      const userInfoToSend: UserInfo = {
        school: form.school,
        grade: form.grade,
        classNum: form.classNum,
        studentNum: form.studentNum,
        schoolLatitude: selectedSchool.schoolLatitude,
        schoolLongitude: selectedSchool.schoolLongitude,
        homeAddress: form.homeAddress || "", // 집 주소는 선택 사항
      };

      // 숫자 필드의 유효성 재검사 (음수나 0 입력 방지)
      if (
        isNaN(userInfoToSend.grade) || userInfoToSend.grade <= 0 ||
        isNaN(userInfoToSend.classNum) || userInfoToSend.classNum <= 0 ||
        isNaN(userInfoToSend.studentNum) || userInfoToSend.studentNum <= 0
      ) {
        alert("학년, 반, 번호는 1 이상의 유효한 숫자여야 합니다.");
        return;
      }

      // Zustand 스토어에 사용자 정보 저장 (persist 미들웨어 덕분에 로컬 스토리지에 자동 저장됨)
      setUserInfo(userInfoToSend);
      alert("사용자 정보가 저장되었습니다!");
      setIsFormOpen(false); // 폼 닫기
    } else {
      // 필수 입력 필드가 누락된 경우 경고
      alert("학교, 학년, 반, 번호는 필수 입력 항목입니다.");
    }
  };

  // 초기화 핸들러 - 모든 저장된 데이터를 삭제하고 새로고침
  const handleReset = () => {
    const confirmed = confirm(
      "모든 저장된 정보가 삭제됩니다.\n" +
      "- 사용자 정보 (학교, 학년, 반, 번호, 집 주소)\n" +
      "- 저장된 출발지 주소\n" +
      "- 급식 조회 날짜\n" +
      "- 시간표 조회 날짜\n\n" +
      "정말로 초기화하시겠습니까?"
    );
    
    if (confirmed) {
      try {
        // 로컬 스토리지에서 모든 관련 데이터 삭제
        localStorage.removeItem('user-storage'); // Zustand persist 데이터
        localStorage.removeItem('startLocation'); // 출발지 주소
        localStorage.removeItem('mealCurrentDate'); // 급식 조회 날짜
        localStorage.removeItem('timetableCurrentDate'); // 시간표 조회 날짜
        
        // Zustand 스토어 초기화
        setUserInfo(null as any); // userInfo를 null로 설정
        
        // 폼 상태 초기화
        setForm({
          school: "",
          grade: undefined,
          classNum: undefined,
          studentNum: undefined,
          homeAddress: "",
        });
        
        setIsFormOpen(false); // 폼 닫기
        
        // 성공 메시지 표시 후 페이지 새로고침으로 완전 초기화
        alert("모든 정보가 초기화되었습니다. 페이지를 새로고침합니다.");
        window.location.reload();
        
      } catch (error) {
        console.error("초기화 중 오류 발생:", error);
        alert("초기화 중 오류가 발생했습니다. 페이지를 직접 새로고침해주세요.");
      }
    }
  };

  return (
    <Container>
      <Title>⚙️ 설정 </Title>
      
      {/* 폼 확장/축소에 따라 보이는 입력 필드들 */}
      <FormWrapper $isOpen={isFormOpen}>
        <Select
          name="school"
          value={form.school}
          onChange={handleChange}
          required
        >
          <option value="" disabled>학교</option>
          {SCHOOL_LIST.map((schoolName) => (
            <option key={schoolName} value={schoolName}>
              {schoolName}
            </option>
          ))}
        </Select>
        <Select
          name="grade"
          value={form.grade}
          onChange={handleChange}
          required
        >
          <option value="" disabled>학년</option>
          {GRADE_LIST.map((gradeNum) => (
            <option key={gradeNum} value={gradeNum}>
              {gradeNum}학년
            </option>
          ))}
        </Select>
        <Input
          name="classNum"
          type="number"
          placeholder="반"
          value={form.classNum === undefined ? "" : form.classNum}
          onChange={handleChange}
          required
          min="1"
        />
        <Input
          name="studentNum"
          type="number"
          placeholder="번호"
          value={form.studentNum === undefined ? "" : form.studentNum}
          onChange={handleChange}
          required
          min="1"
        />
        <InputHome
          name="homeAddress"
          type="text"
          placeholder="집 도로명 주소 (선택 사항)"
          value={form.homeAddress}
          onChange={handleChange}
        />
      </FormWrapper>

      {/* 폼이 열렸을 때만 버튼들 표시 */}
      {isFormOpen && (
        <ButtonGroup>
          <Button onClick={handleSubmit}>저장</Button>
          <ResetButton onClick={handleReset}>초기화</ResetButton>
        </ButtonGroup>
      )}
      
      {/* 폼 확장/축소 토글 버튼 */}
      <ToggleButton onClick={() => setIsFormOpen(!isFormOpen)}>
        {isFormOpen ? "<" : ">"}
      </ToggleButton>
    </Container>
  );
};

export default SetupPage;
// SetUpPage.tsx
import { useState } from "react";
import styled from "styled-components";
import useUserStore from "../store/userStore";
import type { UserInfo } from "../types/user";
import { SCHOOL_CODE_MAP } from "../utils/schoolCodeMap";

const Container = styled.div`
    width: 100%;
    margin: 25px 50px 0px 50px;
    padding: 18px;
    border-radius: 16px;
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    font-family: "Pretendard";
`;

const Title = styled.h1`
    padding-left: 12px;
    font-size: 22px;
    font-weight: bold;
    color: #007acc;
    white-space: nowrap;
    margin-right: auto;
`;

const Input = styled.input`
    width: 180px;
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

const Select = styled.select`
    width: 180px;
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
    &:hover {
        background-color: #005f99;
    }
`;

const GRADE_LIST = [1, 2, 3];

const SCHOOL_LIST = Object.keys(SCHOOL_CODE_MAP);

const SetupPage: React.FC = () => {
  const { userInfo, setUserInfo } = useUserStore();
  const [form, setForm] = useState<Partial<UserInfo>>({
    school: userInfo?.school || "",
    grade: userInfo?.grade || undefined,
    classNum: userInfo?.classNum || undefined,
    studentNum: userInfo?.studentNum || undefined,
    homeAddress: userInfo?.homeAddress || "", // homeAddress 초기값 설정
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "grade" || name === "classNum" || name === "studentNum"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = () => {
    if (
      form.school &&
      form.grade &&
      form.classNum &&
      form.studentNum &&
      form.homeAddress !== undefined // homeAddress가 비어있어도 무방, 그러나 존재 여부 확인
    ) {
      const selectedSchool = SCHOOL_CODE_MAP[form.school];
      if (!selectedSchool) {
        alert("유효하지 않은 학교입니다.");
        return;
      }

      const userInfoToSend: UserInfo = {
        school: form.school,
        grade: form.grade,
        classNum: form.classNum,
        studentNum: form.studentNum,
        schoolLatitude: selectedSchool.schoolLatitude,
        schoolLongitude: selectedSchool.schoolLongitude,
        homeAddress: form.homeAddress, // homeAddress 저장
      };

      if (
        isNaN(userInfoToSend.grade) ||
        isNaN(userInfoToSend.classNum) ||
        isNaN(userInfoToSend.studentNum)
      ) {
        alert("학년, 반, 번호는 유효한 숫자여야 합니다.");
        return;
      }

      setUserInfo(userInfoToSend);
      alert("사용자 정보가 저장되었습니다!");
    } else {
      alert("모든 필수 항목을 입력해주세요.");
    }
  };

  return (
    <Container>
      <Title>사용자 정보 입력</Title>
      <Select
        name="school"
        value={form.school}
        onChange={handleChange}
        required
      >
        <option value="" disabled>학교를 선택해주세요</option>
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
        <option value="" disabled>학년을 선택해주세요</option>
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
        value={form.classNum}
        onChange={handleChange}
        required
      />
      <Input
        name="studentNum"
        type="number"
        placeholder="번호"
        value={form.studentNum}
        onChange={handleChange}
        required
      />
      {/* 집 주소 입력 필드 추가 */}
      <Input
        name="homeAddress"
        type="text"
        placeholder="집 도로명 주소 (예: 서울 강남구 테헤란로 134)"
        value={form.homeAddress}
        onChange={handleChange}
        required
      />
      <Button onClick={handleSubmit}>정보 저장</Button>
    </Container>
  );
};

export default SetupPage;
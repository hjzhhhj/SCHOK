import { useState } from "react";
import styled from "styled-components";
import useUserStore from "../store/userStore";
import type { UserInfo } from "../types/user";
import { SCHOOL_CODE_MAP } from "../utils/schoolCodeMap"; 

const Container = styled.div`
    width: 300px;
    margin: 30px;
    padding: 24px;
    border-radius: 16px;
    background-color: #f0faff;
    box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 16px; 
    font-family: "Pretendard", "Noto Sans KR", sans-serif;
`;

const Title = styled.h1`
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 12px;
    text-align: center;
    color: #007acc; 
`;

const Input = styled.input`
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
    padding: 12px;
    font-size: 16px;
    border-radius: 8px; 
    border: 1px solid #a0d9ff; 
    background-color: white;
    cursor: pointer;
    appearance: none; 
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20fill%3D%22%23007acc%22%20d%3D%22M128%20160l64-64H64z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 1em;
    &:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.2);
    }
`;

const Button = styled.button`
    padding: 12px 20px;
    font-size: 18px; 
    background-color: #007acc; 
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.2s ease; 

    &:hover {
        background-color: #005fa3; 
        box-shadow: 0 4px 12px rgba(0, 128, 255, 0.2);
    }

    &:active {
        background-color: #004a80;
    }
`;

interface FormState {
  school: string;
  grade: string;
  classNum: string;
  studentNum: string;
}

const SCHOOL_LIST = [
    "설악중학교",
    "속초중학교",
    "해랑중학교",
    "설온중학교",
    "설악고등학교",
    "속초고등학교",
    "속초여자고등학교",
];

const GRADE_LIST = [1, 2, 3];

function SetupPage() {
  const { setUserInfo } = useUserStore();
  const [form, setForm] = useState<FormState>({
    school: "",
    grade: "",
    classNum: "",
    studentNum: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    if (
      form.school &&
      form.grade !== "" &&
      form.classNum !== "" &&
      form.studentNum !== ""
    ) {
      const schoolInfo = SCHOOL_CODE_MAP[form.school];
      if (!schoolInfo) {
        alert("선택한 학교에 대한 정보가 없습니다. 학교 코드를 추가해주세요.");
        return;
      }

      const userInfoToSend: UserInfo = {
        school: form.school,
        grade: Number(form.grade),
        classNum: Number(form.classNum),
        studentNum: Number(form.studentNum),
        schoolLatitude: schoolInfo.schoolLatitude, // 학교 위도 추가
        schoolLongitude: schoolInfo.schoolLongitude, // 학교 경도 추가
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
      alert("모든 항목을 입력해주세요.");
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
      <Button onClick={handleSubmit}>시작하기</Button>
    </Container>
  );
}

export default SetupPage;
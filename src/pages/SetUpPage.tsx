import { useState } from "react";
import styled from "styled-components";
import useUserStore from "../store/userStore";
import type { UserInfo } from "../types/user"; 

const Container = styled.div`
  max-width: 400px;
  margin: 60px auto;
  padding: 24px;
  border: 1px solid #ccc;
  border-radius: 12px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
  text-align: center;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
`;

const Button = styled.button`
  padding: 10px;
  font-size: 16px;
  background-color: #3478f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background-color: #255edb;
  }
`;

// 폼 입력 필드를 위한 별도의 타입 정의 (초기 상태에서 빈 문자열 허용)
interface FormState {
  school: string;
  grade: string;
  classNum: string;
  studentNum: string;
}

function SetupPage() {
  const { setUserInfo } = useUserStore();
  // 폼 상태는 모든 필드를 문자열로 관리
  const [form, setForm] = useState<FormState>({
    school: "",
    grade: "",
    classNum: "",
    studentNum: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    // 폼 유효성 검사
    if (
      form.school &&
      form.grade !== "" &&
      form.classNum !== "" &&
      form.studentNum !== ""
    ) {

      const userInfoToSend: UserInfo = {
        school: form.school,
        grade: Number(form.grade),       
        classNum: Number(form.classNum), 
        studentNum: Number(form.studentNum), 
      };

      // 숫자로 변환했을 때 유효한 숫자인지 검사하기!
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
      // 여기에 다음 페이지로 이동하는 로직 추가해야댐
    } else {
      alert("모든 항목을 입력해주세요.");
    }
  };

  return (
    <Container>
      <Title>🎓 사용자 정보 입력</Title>
      <Input
        name="school"
        placeholder="학교명"
        value={form.school}
        onChange={handleChange}
        required
      />
      <Input
        name="grade"
        type="number" // 숫자만 입력받도록 type 변경
        placeholder="학년"
        value={form.grade} // form.grade는 string이므로 value에 직접 사용
        onChange={handleChange}
        required
      />
      <Input
        name="classNum"
        type="number" // 숫자만 입력받도록 type 변경
        placeholder="반"
        value={form.classNum}
        onChange={handleChange}
        required
      />
      <Input
        name="studentNum"
        type="number" // 숫자만 입력받도록 type 변경
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
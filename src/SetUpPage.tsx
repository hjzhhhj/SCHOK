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

function SetupPage() {
  const { setUserInfo } = useUserStore();
  const [form, setForm] = useState<UserInfo>({
    school: "",
    grade: "",
    classNum: "",
    studentNum: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (form.school && form.grade && form.classNum && form.studentNum) {
      setUserInfo(form);
    } else {
      alert("모든 항목을 입력해주세요.");
    }
  };

  return (
    <Container>
      <Title>🎓 사용자 정보 입력</Title>
      <Input
        name="school"
        placeholder="학교명 (예: 속초여고)"
        onChange={handleChange}
      />
      <Input
        name="grade"
        placeholder="학년"
        onChange={handleChange}
      />
      <Input
        name="classNum"
        placeholder="반"
        onChange={handleChange}
      />
      <Input
        name="studentNum"
        placeholder="번호"
        onChange={handleChange}
      />
      <Button onClick={handleSubmit}>시작하기</Button>
    </Container>
  );
}

export default SetupPage;

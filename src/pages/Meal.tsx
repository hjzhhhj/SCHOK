// 학교 급식 정보를 불러와 화면에 표시하는 컴포넌트

import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import useUserStore from "../store/userStore";
import { SCHOOL_CODE_MAP } from "../utils/schoolCodeMap"; 

// MealData 인터페이스: API 응답에서 필요한 급식 데이터 타입 정의
interface MealData {
    DDISH_NM: string; // 급식 메뉴명
    MLSV_YMD: string; // 급식 일자
    MMEAL_SC_NM: string; // 급식 시간 (조식, 중식, 석식)
}

// --- 스타일 컴포넌트 ---
const Container = styled.div`
    width: 350px;
    padding: 24px;
    margin: 0px;
    border-radius: 16px;
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
    font-family: "Pretendard";
    display: flex;
    flex-direction: column;
    height: 600px;
`;

const ContentArea = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Title = styled.h2`
    text-align: center;
    font-size: 24px;
    color: #007acc;
    margin-bottom: 20px;
    font-family: "Jua";
    font-weight: 400;
`;

const DateDisplay = styled.div`
    text-align: center;
    font-size: 18px;
    color: #007acc;
    margin-bottom: 15px;
    font-family: "Jua";
    font-weight: 400;
`;

const List = styled.ul`
    list-style: none;
    padding: 0;
    flex: 1;
    overflow-y: auto;
`;

const ListItem = styled.li`
    background-color: #ffffff;
    padding: 16px;
    margin-bottom: 12px;
    border-left: 5px solid #009fe3;
    border-radius: 8px;
    font-size: 15px;
    white-space: pre-line;
    line-height: 1.6;
    transition: background 0.2s;

    &:hover {
        background-color: #e6f7ff;
    }
`;

const MealType = styled.div`
    font-weight: bold;
    color: #007acc;
    margin-bottom: 6px;
`;

const Message = styled.p`
    text-align: center;
    color: #666;
    font-size: 16px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
`;

const NavButton = styled.button`
    padding: 10px 15px;
    font-size: 16px;
    background-color: #007acc;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: #005fa3;
    }

    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;

// --- Meal 컴포넌트 ---
const Meal: React.FC = () => {
    const [meals, setMeals] = useState<MealData[]>([]); // 급식 데이터
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [noData, setNoData] = useState(false); // 데이터 없음 상태
    
    // 현재 표시 날짜 (로컬 스토리지에서 초기값 불러오기)
    const [currentDate, setCurrentDate] = useState<Date>(() => {
        const savedDate = localStorage.getItem('mealCurrentDate');
        return savedDate ? new Date(savedDate) : new Date(); // 저장된 날짜가 없으면 오늘 날짜
    });
    
    const { userInfo } = useUserStore(); // 사용자 정보 스토어에서 가져오기

    const serviceKey = import.meta.env.VITE_APP_NEIS_API_KEY; // NEIS API 키

    // currentDate가 변경될 때마다 로컬 스토리지에 저장
    useEffect(() => {
        localStorage.setItem('mealCurrentDate', currentDate.toISOString());
    }, [currentDate]);

    // Date 객체를 API 요청에 맞는 YYYYMMDD 형식으로 변환
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    };

    // Date 객체를 화면 표시용 YYYY년 MM월 DD일 (요일) 형식으로 변환
    const displayDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString();
        const day = date.getDate().toString();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayOfWeek = days[date.getDay()];
        return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
    };

    // 급식 정보를 불러오는 효과 (날짜, 사용자 정보, API 키 변경 시 재실행)
    useEffect(() => {
        const fetchMeals = async () => {
            // 로딩 상태 시작 및 데이터/에러 상태 초기화
            setLoading(true);
            setNoData(false);
            setMeals([]); 

            // 사용자 정보가 없으면 데이터 없음 처리 후 함수 종료
            if (!userInfo || !userInfo.school) {
                setNoData(true); 
                setLoading(false);
                return;
            }

            // 사용자 정보에서 학교 코드 매핑
            const schoolInfo = SCHOOL_CODE_MAP[userInfo.school]; 

            // 학교 정보가 없으면 에러 처리 후 함수 종료
            if (!schoolInfo) {
                console.error("선택된 학교의 정보를 찾을 수 없습니다.");
                setNoData(true);
                setLoading(false);
                return;
            }
            
            // 현재 날짜를 API 형식으로 변환
            const formattedDate = formatDate(currentDate); 

            try {
                // NEIS 급식 API 호출
                const response = await axios.get("https://open.neis.go.kr/hub/mealServiceDietInfo", {
                    params: {
                        KEY: serviceKey, // API 키 사용
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: schoolInfo.atptOfcdcScCode, // 교육청 코드
                        SD_SCHUL_CODE: schoolInfo.sdSchulCode, // 학교 코드
                        MLSV_YMD: formattedDate, // 급식 일자
                    },
                });

                // API 응답에서 급식 데이터 추출
                const mealServiceDietInfo = response.data?.mealServiceDietInfo;
                let extractedMeals: MealData[] = [];
                let dataFound = false;

                // 실제 급식 데이터가 있는 경우
                if (mealServiceDietInfo && mealServiceDietInfo[1]?.row) {
                    extractedMeals = mealServiceDietInfo[1].row;
                    dataFound = true;
                } 
                // 데이터는 없지만 '데이터 없음' 코드인 경우
                else if (mealServiceDietInfo && mealServiceDietInfo[0]?.head?.[1]?.RESULT?.CODE === "INFO-200") {
                    dataFound = false; 
                } 
                // 그 외 예상치 못한 응답인 경우
                else {
                    console.error("NEIS API 응답이 예상과 다릅니다:", response.data);
                    dataFound = false;
                }

                // 데이터 발견 여부에 따라 상태 업데이트
                if (dataFound) {
                    setMeals(extractedMeals);
                    setNoData(false);
                } else {
                    setNoData(true);
                    setMeals([]); 
                }

            } catch (error) {
                // API 호출 실패 시 에러 처리
                console.error("급식 정보를 불러오는 데 실패했어요:", error);
                setNoData(true); 
                setMeals([]); 
            } finally {
                setLoading(false); // 로딩 상태 종료
            }
        };

        fetchMeals(); // 급식 정보 불러오기 실행
    }, [userInfo, currentDate, serviceKey]); 

    // 이전 날짜로 이동하는 핸들러
    const handlePreviousDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    // 다음 날짜로 이동하는 핸들러
    const handleNextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    // --- 렌더링 로직 ---
    // 사용자 정보가 없으면 안내 메시지 표시
    if (!userInfo || !userInfo.school) {
        return (
            <Container>
                <ContentArea>
                    <Title>☁️ 오늘의 급식 ☁️</Title>
                    <Message>사용자 정보를 먼저 입력해주세요.</Message>
                </ContentArea>
                <ButtonContainer>
                    <NavButton onClick={handlePreviousDay}>{"< 이전 날짜"}</NavButton>
                    <NavButton onClick={handleNextDay}>{"다음 날짜 >"}</NavButton>
                </ButtonContainer>
            </Container>
        );
    }

    return (
        <Container>
            <ContentArea>
                <Title>☁️ 오늘의 급식 ☁️</Title>
                <DateDisplay>{displayDate(currentDate)}</DateDisplay>

                {loading ? ( // 로딩 중일 때
                    <Message>급식 정보를 불러오는 중...</Message>
                ) : noData ? ( // 데이터가 없을 때
                    <Message>선택한 날짜에는 급식 정보가 없어요.</Message>
                ) : ( // 급식 데이터가 있을 때 목록 표시
                    <List>
                        {meals.map((meal, index) => (
                            <ListItem key={index}>
                                <MealType>{meal.MMEAL_SC_NM}</MealType>
                                {meal.DDISH_NM.replace(/<br\/>/g, "\n")}
                            </ListItem>
                        ))}
                    </List>
                )}
            </ContentArea>
            <ButtonContainer>
                <NavButton onClick={handlePreviousDay}>{"< 이전 날짜"}</NavButton>
                <NavButton onClick={handleNextDay}>{"다음 날짜 >"}</NavButton>
            </ButtonContainer>
        </Container>
    );
};

export default Meal;
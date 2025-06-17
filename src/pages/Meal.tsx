// 학교 급식 정보를 불러와 화면에 표시하는 컴포넌트

import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import useUserStore from "../store/userStore";
import { SCHOOL_CODE_MAP } from "../utils/schoolCodeMap"; 

interface MealData {
    DDISH_NM: string; // 급식 메뉴명
    MLSV_YMD: string; // 급식 일자
    MMEAL_SC_NM: string; // 급식 시간 (조식, 중식, 석식)
}

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
`;

const DateDisplay = styled.div`
    text-align: center;
    font-size: 18px;
    color: #007acc;
    margin-bottom: 15px;
    font-weight: bold;
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

const Meal: React.FC = () => {
    const [meals, setMeals] = useState<MealData[]>([]); 
    const [loading, setLoading] = useState(true); 
    const [noData, setNoData] = useState(false); 
    const [currentDate, setCurrentDate] = useState(new Date()); 
    const { userInfo } = useUserStore(); 

    // Date 객체를 API 요청에 맞는 YYYYMMDD 형식으로 변환
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    };

    // Date 객체를 화면 표시용 YYYY년 MM월 DD일 형식으로 변환
    const displayDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString();
        const day = date.getDate().toString();
        return `${year}년 ${month}월 ${day}일`;
    };

    // 급식 정보를 불러오는 useEffect
    useEffect(() => {
        const fetchMeals = async () => {
            // 사용자 정보 없으면 로딩 끄고 데이터 없음 처리
            if (!userInfo || !userInfo.school) {
                setNoData(true);
                setLoading(false);
                return;
            }

            const schoolInfo = SCHOOL_CODE_MAP[userInfo.school]; // 학교 정보 매핑

            // 학교 정보가 없으면 에러 처리
            if (!schoolInfo) {
                console.error("학교 정보를 찾을 수 없습니다.");
                setNoData(true);
                setLoading(false);
                return;
            }

            const serviceKey = import.meta.env.VITE_APP_NEIS_API_KEY; 
            const formattedDate = formatDate(currentDate); // 현재 날짜를 API 형식으로 변환

            try {
                // NEIS 급식 API 호출
                const response = await axios.get("https://open.neis.go.kr/hub/mealServiceDietInfo", {
                    params: {
                        KEY: serviceKey,
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: schoolInfo.atptOfcdcScCode, // 교육청 코드
                        SD_SCHUL_CODE: schoolInfo.sdSchulCode, // 학교 코드
                        MLSV_YMD: formattedDate, // 급식 일자
                    },
                });

                let extractedMeals: MealData[] = [];
                let dataFound = false;

                // API 응답에서 급식 데이터(row) 추출
                if (response.data?.mealServiceDietInfo?.[0]?.row) {
                    extractedMeals = response.data.mealServiceDietInfo[0].row;
                    dataFound = true;
                }

                if (dataFound) {
                    setMeals(extractedMeals);
                    setNoData(false);
                } else {
                    setNoData(true);
                }

            } catch (error) {
                console.error("급식 정보를 불러오는 데 실패했어요:", error);
                setNoData(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMeals(); // 급식 정보 불러오기 실행
    }, [userInfo, currentDate]); // userInfo 또는 currentDate가 변경될 때마다 재실행

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

    // 사용자 정보가 없을 경우 안내 메시지 표시
    if (!userInfo) {
        return (
            <Container>
                <ContentArea>
                    <Title>오늘의 급식</Title>
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
                <Title>오늘의 급식</Title>
                <DateDisplay>{displayDate(currentDate)}</DateDisplay>

                {loading ? ( // 로딩 중일 때 메시지
                    <Message>급식 정보를 불러오는 중...</Message>
                ) : noData ? ( // 데이터가 없을 때 메시지
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
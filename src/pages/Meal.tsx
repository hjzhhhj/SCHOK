import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import useUserStore from "../store/userStore";
import { SCHOOL_CODE_MAP } from "../utils/schoolCodeMap";

interface MealData {
    DDISH_NM: string;
    MLSV_YMD: string;
    MMEAL_SC_NM: string;
}

const Container = styled.div`
    width: 400px;
    margin: 30px;
    padding: 24px;
    border-radius: 16px;
    background-color: #f0faff;
    box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
    font-family: "Pretendard", "Noto Sans KR", sans-serif;
`;

const Title = styled.h2`
    text-align: center;
    font-size: 24px;
    color: #007acc;
    margin-bottom: 20px;
`;

const List = styled.ul`
    list-style: none;
    padding: 0;
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
    margin-top: 24px;
`;

const Meal: React.FC = () => {
    const [meals, setMeals] = useState<MealData[]>([]);
    const [loading, setLoading] = useState(true);
    const [noData, setNoData] = useState(false);
    const { userInfo } = useUserStore();

    useEffect(() => {
        const fetchMeals = async () => {
            if (!userInfo || !userInfo.school) {
                setNoData(true);
                setLoading(false);
                return;
            }

            const schoolInfo = SCHOOL_CODE_MAP[userInfo.school];

            if (!schoolInfo) {
                console.error("학교 정보를 찾을 수 없습니다.");
                setNoData(true);
                setLoading(false);
                return;
            }

            const serviceKey = import.meta.env.VITE_APP_NEIS_API_KEY;
            
            // ! 날짜 처리 수정: 한국 시간으로 오늘 날짜를 "YYYYMMDD" 형식으로 만듭니다.
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const day = today.getDate().toString().padStart(2, '0');
            const formattedDate = `${year}${month}${day}`;

            try {
                const response = await axios.get("https://open.neis.go.kr/hub/mealServiceDietInfo", {
                    params: {
                        KEY: serviceKey,
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: schoolInfo.atptOfcdcScCode,
                        SD_SCHUL_CODE: schoolInfo.sdSchulCode,
                        MLSV_YMD: formattedDate, // ! 여기에 수정된 날짜 변수 사용
                    },
                });

                console.log("--- 급식 API 응답 전체 데이터 ---", response.data);

                let extractedMeals: MealData[] = [];
                let dataFound = false;

                // mealServiceDietInfo 키가 있고 배열인지 확인
                if (response.data && Array.isArray(response.data.mealServiceDietInfo)) {
                    const mealServiceInfoRoot = response.data.mealServiceDietInfo;

                    // mealServiceInfo 배열 내에서 'row' 키를 가진 객체를 찾습니다.
                    for (const item of mealServiceInfoRoot) {
                        if (item && Array.isArray(item.row) && item.row.length > 0) {
                            extractedMeals = item.row;
                            dataFound = true;
                            break; // 첫 번째 'row' 데이터를 찾으면 루프 종료
                        }
                    }
                }

                if (dataFound) {
                    console.log("가져온 급식 데이터:", extractedMeals);
                    setMeals(extractedMeals);
                    setNoData(false);
                } else {
                    console.log("급식 데이터 없음 (API 응답에서 row를 찾지 못함 또는 데이터가 비어있음).");
                    setNoData(true);
                }

            } catch (error) {
                console.error("급식 정보를 불러오는 데 실패했어요:", error);
                setNoData(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMeals();
    }, [userInfo]);

    if (!userInfo) {
        return (
            <Container>
                <Title>오늘의 급식</Title>
                <Message>사용자 정보를 먼저 입력해주세요.</Message>
            </Container>
        );
    }

    return (
        <Container>
            <Title>오늘의 급식</Title>

            {loading ? (
                <Message>급식 정보를 불러오는 중...</Message>
            ) : noData ? (
                    <Message>오늘은 급식 정보가 없어요.</Message>
            ) : (
                <List>
                    {meals.map((meal, index) => (
                        <ListItem key={index}>
                            <MealType>{meal.MMEAL_SC_NM}</MealType>
                            {meal.DDISH_NM.replace(/<br\/>/g, "\n")}
                        </ListItem>
                    ))}
                </List>
            )}
        </Container>
    );
};

export default Meal;
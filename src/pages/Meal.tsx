import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import useUserStore from "../store/userStore";

interface MealData {
    DDISH_NM: string;
    MLSV_YMD: string;
    MMEAL_SC_NM: string;
}

const Container = styled.div`
    max-width: 500px;
    margin: 40px auto;
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

    useEffect(() => {
        const fetchMeals = async () => {
            const serviceKey = import.meta.env.VITE_APP_NEIS_API_KEY;
            const today = new Date().toISOString().split("T")[0].replace(/-/g, "");

            try {
                const response = await axios.get("https://open.neis.go.kr/hub/mealServiceDietInfo", {
                    params: {
                        KEY: serviceKey,
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: "K10",
                        SD_SCHUL_CODE: "7801152",
                        MLSV_YMD: today,
                    },
                });

                const result = response.data.mealServiceDietInfo;

                if (!result || result.length < 2 || !result[1].row || result[1].row.length === 0) {
                    setNoData(true);
                } else {
                    setMeals(result[1].row);
                }
            } catch (error) {
                console.error("급식 정보를 불러오는 데 실패했어요:", error);
                setNoData(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMeals();
    }, []);

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

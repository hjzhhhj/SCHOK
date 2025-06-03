import React, { useEffect, useState } from "react";
import axios from "axios";

interface MealData {
    DDISH_NM: string;
    MLSV_YMD: string;
    MMEAL_SC_NM: string; 
}

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
                        MLSV_YMD: "20250604",
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
        <div>
            <h2>오늘의 급식</h2>
            {loading ? (
                <p>급식 정보를 불러오는 중...</p>
            ) : noData ? (
                <p>오늘은 급식 정보가 없어요.</p>
            ) : (
                <ul>
                    {meals.map((meal, index) => (
                        <li key={index}>
                            <strong>{meal.MMEAL_SC_NM}</strong>:<br />
                            {meal.DDISH_NM.replace(/<br\/>/g, ", ")}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Meal;

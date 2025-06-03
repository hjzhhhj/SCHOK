import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

interface TimetableEntry {
    PERIO: string;
    ITRT_CNTNT: string;
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
    padding: 12px 16px;
    margin-bottom: 12px;
    border-left: 5px solid #007acc;
    border-radius: 8px;
    font-size: 16px;
    transition: background 0.2s;

    &:hover {
        background-color: #e6f7ff;
    }
`;

const Period = styled.span`
    font-weight: bold;
    color: #005fa3;
`;

const Message = styled.p`
    text-align: center;
    color: #666;
    font-size: 16px;
    margin-top: 24px;
`;

const Timetable: React.FC = () => {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [noData, setNoData] = useState(false);

    useEffect(() => {
        const fetchTimetable = async () => {
            const serviceKey = import.meta.env.VITE_APP_NEIS_API_KEY;
            const today = new Date().toISOString().split("T")[0].replace(/-/g, "");

            try {
                const response = await axios.get("https://open.neis.go.kr/hub/hisTimetable", {
                    params: {
                        KEY: serviceKey,
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: "K10",
                        SD_SCHUL_CODE: "7801152",
                        GRADE: "1",
                        CLASS_NM: "1",
                        ALL_TI_YMD: today,
                    },
                });

                const result = response.data.hisTimetable;

                if (!result || result.length < 2 || !result[1].row || result[1].row.length === 0) {
                    setNoData(true);
                } else {
                    setTimetable(result[1].row);
                }
            } catch (error) {
                console.error("시간표를 불러오는 데 실패했어요:", error);
                setNoData(true);
            } finally {
                setLoading(false);
            }
        };

        fetchTimetable();
    }, []);

    return (
        <Container>
            <Title>오늘의 시간표</Title>

            {loading ? (
                <Message>시간표 불러오는 중...</Message>
            ) : noData ? (
                <Message>오늘은 등록된 시간표가 없어요.</Message>
            ) : (
                <List>
                    {timetable.map((entry, index) => (
                        <ListItem key={index}>
                            <Period>{entry.PERIO}교시</Period>: {entry.ITRT_CNTNT}
                        </ListItem>
                    ))}
                </List>
            )}
        </Container>
    );
};

export default Timetable;
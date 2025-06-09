import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import useUserStore from "../store/userStore";
import { SCHOOL_CODE_MAP } from "../utils/schoolCodeMap";

interface TimetableEntry {
    PERIO: string;
    ITRT_CNTNT: string;
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

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
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

const Timetable: React.FC = () => {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [noData, setNoData] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const { userInfo } = useUserStore();

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    };

    const displayDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString();
        const day = date.getDate().toString();
        return `${year}년 ${month}월 ${day}일`;
    };

    useEffect(() => {
        const fetchTimetable = async () => {
            if (!userInfo || !userInfo.school || !userInfo.grade || !userInfo.classNum) {
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
            const formattedDate = formatDate(currentDate);

            let apiUrl = "";

            if (schoolInfo.schoolType === "고등학교") {
                apiUrl = "https://open.neis.go.kr/hub/hisTimetable";
            } else if (schoolInfo.schoolType === "중학교") {
                apiUrl = "https://open.neis.go.kr/hub/misTimetable";
            } else if (schoolInfo.schoolType === "초등학교") {
                apiUrl = "https://open.neis.go.kr/hub/elsTimetable";
            } else {
                console.error("알 수 없는 학교 종류입니다.");
                setNoData(true);
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(apiUrl, {
                    params: {
                        KEY: serviceKey,
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: schoolInfo.atptOfcdcScCode,
                        SD_SCHUL_CODE: schoolInfo.sdSchulCode,
                        GRADE: userInfo.grade,
                        CLASS_NM: userInfo.classNum,
                        ALL_TI_YMD: formattedDate,
                    },
                });

                console.log("--- 시간표 API 응답 전체 데이터 ---", response.data);

                let extractedTimetable: TimetableEntry[] = [];
                let dataFound = false;

                // API 응답의 루트 키를 동적으로 접근
                // 예: hisTimetable, misTimetable, elsTimetable
                const rootKey = apiUrl.split('/').pop()!; // URL의 마지막 부분 (예: hisTimetable)
                if (response.data && Array.isArray(response.data[rootKey])) {
                    const timetableRoot = response.data[rootKey];

                    for (const item of timetableRoot) {
                        if (item && Array.isArray(item.row) && item.row.length > 0) {
                            extractedTimetable = item.row;
                            dataFound = true;
                            break;
                        }
                    }
                }

                if (dataFound) {
                    console.log("가져온 시간표 데이터:", extractedTimetable);
                    setTimetable(extractedTimetable);
                    setNoData(false);
                } else {
                    console.log("시간표 데이터 없음 (API 응답에서 row를 찾지 못함 또는 데이터가 비어있음).");
                    setNoData(true);
                }

            } catch (error) {
                console.error("시간표를 불러오는 데 실패했어요:", error);
                setNoData(true);
            } finally {
                setLoading(false);
            }
        };

        fetchTimetable();
    }, [userInfo, currentDate]);

    const handlePreviousDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    if (!userInfo) {
        return (
            <Container>
                <Title>오늘의 시간표</Title>
                <Message>사용자 정보를 먼저 입력해주세요.</Message>
            </Container>
        );
    }

    return (
        <Container>
            <Title>오늘의 시간표</Title>
            <DateDisplay>{displayDate(currentDate)}</DateDisplay>

            {loading ? (
                <Message>시간표 불러오는 중...</Message>
            ) : noData ? (
                <Message>선택한 날짜에는 등록된 시간표가 없어요.</Message>
            ) : (
                <List>
                    {timetable.map((entry, index) => (
                        <ListItem key={index}>
                            <Period>{entry.PERIO}교시</Period>: {entry.ITRT_CNTNT}
                        </ListItem>
                    ))}
                </List>
            )}
            <ButtonContainer>
                <NavButton onClick={handlePreviousDay}>{"< 이전 날짜"}</NavButton>
                <NavButton onClick={handleNextDay}>{"다음 날짜 >"}</NavButton>
            </ButtonContainer>
        </Container>
    );
};

export default Timetable;
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
    const { userInfo } = useUserStore();

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
            
            // ! 날짜 처리 수정: 한국 시간으로 오늘 날짜를 "YYYYMMDD" 형식으로 만듭니다.
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const day = today.getDate().toString().padStart(2, '0');
            const formattedDate = `${year}${month}${day}`;

            try {
                const response = await axios.get("https://open.neis.go.kr/hub/hisTimetable", {
                    params: {
                        KEY: serviceKey,
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: schoolInfo.atptOfcdcScCode,
                        SD_SCHUL_CODE: schoolInfo.sdSchulCode,
                        GRADE: userInfo.grade,
                        CLASS_NM: userInfo.classNum,
                        // ALL_TI_YMD는 일일 시간표, MLSV_YMD는 급식 날짜. 시간표는 ALL_TI_YMD를 써야 합니다.
                        ALL_TI_YMD: formattedDate, // ! 여기에 수정된 날짜 변수 사용
                    },
                });

                console.log("--- 시간표 API 응답 전체 데이터 ---", response.data);

                let extractedTimetable: TimetableEntry[] = [];
                let dataFound = false;

                // hisTimetable 키가 있고 배열인지 확인
                if (response.data && Array.isArray(response.data.hisTimetable)) {
                    // hisTimetable 배열 내에서 'row' 키를 가진 객체를 찾습니다.
                    // 스크린샷 상으로는 hisTimetable 배열의 두 번째 요소에 row가 있을 가능성이 있습니다.
                    const hisTimetableRoot = response.data.hisTimetable; 

                    // hisTimetable 배열의 각 요소를 순회하며 'row' 키를 가진 객체를 찾습니다.
                    for (const item of hisTimetableRoot) {
                        if (item && Array.isArray(item.row) && item.row.length > 0) {
                            extractedTimetable = item.row;
                            dataFound = true;
                            break; // 첫 번째 'row' 데이터를 찾으면 루프 종료
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
    }, [userInfo]);

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
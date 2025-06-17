// 학교 시간표 정보를 불러와 화면에 표시하는 컴포넌트

import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import useUserStore from "../store/userStore";
import { SCHOOL_CODE_MAP } from "../utils/schoolCodeMap";

// 시간표 항목의 타입 정의
interface TimetableEntry {
    PERIO: string;      // 교시
    ITRT_CNTNT: string; // 과목명 또는 내용
}

const Container = styled.div`
    width: 350px;
    margin: 0px;
    padding: 24px;
    border-radius: 16px;
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
    font-family: "Pretendard", "Noto Sans KR", sans-serif;
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

// --- Timetable 컴포넌트 ---
const Timetable: React.FC = () => {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]); // 시간표 데이터
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [noData, setNoData] = useState(false); // 데이터 없음 상태
    const [currentDate, setCurrentDate] = useState(new Date()); // 현재 표시 날짜
    const { userInfo } = useUserStore(); // 사용자 정보 스토어에서 가져오기

    // 날짜를 API 요청 형식 (YYYYMMDD)으로 변환
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    };

    // 날짜를 화면 표시 형식 (YYYY년 MM월 DD일)으로 변환
    const displayDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString();
        const day = date.getDate().toString();
        return `${year}년 ${month}월 ${day}일`;
    };

    // 시간표 데이터를 불러오는 효과 (userInfo, currentDate 변경 시 실행)
    useEffect(() => {
        const fetchTimetable = async () => {
            // 로딩 시작, 이전 데이터/에러 상태 초기화
            setLoading(true);
            setNoData(false);
            setTimetable([]);

            // 사용자 정보(학교, 학년, 반)가 없으면 데이터 없음 처리 후 종료
            if (!userInfo || !userInfo.school || !userInfo.grade || !userInfo.classNum) {
                setNoData(true);
                setLoading(false);
                return;
            }

            // 사용자 정보에서 학교 정보 가져오기
            const schoolInfo = SCHOOL_CODE_MAP[userInfo.school];

            // 학교 정보가 없으면 에러 처리 후 종료
            if (!schoolInfo) {
                console.error("학교 정보를 찾을 수 없습니다.");
                setNoData(true);
                setLoading(false);
                return;
            }

            const serviceKey = import.meta.env.VITE_APP_NEIS_API_KEY; // NEIS API 키
            const formattedDate = formatDate(currentDate); // 현재 날짜 API 형식으로 변환

            let apiUrl = "";
            // 학교 종류에 따라 다른 API 엔드포인트 설정
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
                // NEIS 시간표 API 호출
                const response = await axios.get(apiUrl, {
                    params: {
                        KEY: serviceKey,
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: schoolInfo.atptOfcdcScCode, // 교육청 코드
                        SD_SCHUL_CODE: schoolInfo.sdSchulCode,         // 학교 코드
                        GRADE: userInfo.grade,                       // 학년
                        CLASS_NM: userInfo.classNum,                 // 반
                        ALL_TI_YMD: formattedDate,                   // 시간표 일자
                    },
                });

                console.log("--- 시간표 API 응답 전체 데이터 ---", response.data);

                let extractedTimetable: TimetableEntry[] = [];
                let dataFound = false;

                // API 응답의 루트 키를 동적으로 접근 (예: hisTimetable, misTimetable, elsTimetable)
                const rootKey = apiUrl.split('/').pop()!; // URL의 마지막 부분을 키로 사용
                if (response.data && Array.isArray(response.data[rootKey])) {
                    const timetableRoot = response.data[rootKey];

                    // timetableRoot 배열을 순회하며 'row' 데이터 찾기
                    for (const item of timetableRoot) {
                        if (item && Array.isArray(item.row) && item.row.length > 0) {
                            extractedTimetable = item.row;
                            dataFound = true;
                            break; // 데이터 찾으면 반복 중단
                        }
                    }
                }

                // 데이터 발견 여부에 따라 상태 업데이트
                if (dataFound) {
                    console.log("가져온 시간표 데이터:", extractedTimetable);
                    setTimetable(extractedTimetable);
                    setNoData(false);
                } else {
                    console.log("시간표 데이터 없음 (API 응답에서 row를 찾지 못했거나 데이터가 비어있음).");
                    setNoData(true);
                }

            } catch (error) {
                // API 호출 실패 시 에러 처리
                console.error("시간표를 불러오는 데 실패했어요:", error);
                setNoData(true);
            } finally {
                setLoading(false); // 로딩 종료
            }
        };

        fetchTimetable();
    }, [userInfo, currentDate]); // userInfo 또는 currentDate가 변경될 때마다 시간표 다시 불러옴

    // 이전 날짜로 이동
    const handlePreviousDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    // 다음 날짜로 이동
    const handleNextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    // 사용자 정보가 없을 경우 안내 메시지 렌더링
    if (!userInfo) {
        return (
            <Container>
                <ContentArea>
                    <Title>☁️ 이날의 시간표 ☁️</Title>
                    <Message>사용자 정보를 먼저 입력해주세요.</Message>
                </ContentArea>
                <ButtonContainer>
                    <NavButton onClick={handlePreviousDay}>{"< 이전 날짜"}</NavButton>
                    <NavButton onClick={handleNextDay}>{"다음 날짜 >"}</NavButton>
                </ButtonContainer>
            </Container>
        );
    }

    // 메인 시간표 UI 렌더링
    return (
        <Container>
            <ContentArea>
                <Title>시간표</Title>
                <DateDisplay>{displayDate(currentDate)}</DateDisplay>

                {loading ? ( // 로딩 중일 때 메시지
                    <Message>시간표 불러오는 중...</Message>
                ) : noData ? ( // 데이터가 없을 때 메시지
                    <Message>선택한 날짜에는 등록된 시간표가 없어요.</Message>
                ) : ( // 시간표 데이터가 있을 때 목록 표시
                    <List>
                        {timetable.map((entry, index) => (
                            <ListItem key={index}>
                                <Period>{entry.PERIO}교시</Period>: {entry.ITRT_CNTNT}
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

export default Timetable;
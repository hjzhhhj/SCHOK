import React, { useEffect, useState } from "react";
import axios from "axios";

interface TimetableEntry {
    PERIO: string;
    ITRT_CNTNT: string;
}

const Timetable: React.FC = () => {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

    useEffect(() => {
        const fetchTimetable = async () => {
            const serviceKey = import.meta.env.VITE_APP_NEIS_API_KEY;
            const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
            try {
                const response = await axios.get("https://open.neis.go.kr/hub/hisTimetable", {
                    params: {
                        KEY: serviceKey,
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: "K10", // 강원도교육청
                        SD_SCHUL_CODE: "7801152",  // 속고
                        GRADE: "1",
                        CLASS_NM: "1",
                        ALL_TI_YMD: "20250604",
                    },
                });

                const result = response.data.hisTimetable;

                if (!result || result.length < 1) {
                    console.warn("시간표 데이터가 없어요. 혹시 오늘이 공휴일일 수도 있어요.");
                    return;
                }

                const data = result[1].row;
                setTimetable(data);
            } catch (error) {
                console.error("시간표를 불러오는 데 실패했어요:", error);
            }
        };

        fetchTimetable();
    }, []);

    return (
        <div>
            <h2>오늘의 시간표</h2>
            <ul>
                {timetable.map((entry, index) => (
                    <li key={index}>
                        {entry.PERIO}교시: {entry.ITRT_CNTNT}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Timetable;

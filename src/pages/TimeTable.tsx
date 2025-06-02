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
            const serviceKey = "NEIS_API_KEY";
            const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
            try {
                const response = await axios.get("https://open.neis.go.kr/hub/hisTimetable", {
                    params: {
                        KEY: serviceKey,
                        Type: "json",
                        ATPT_OFCDC_SC_CODE: "J10",
                        SD_SCHUL_CODE: "7010533",
                        GRADE: "1",
                        CLASS_NM: "1",
                        ALL_TI_YMD: today,
                    },
                });

                const data = response.data.hisTimetable[1].row;
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

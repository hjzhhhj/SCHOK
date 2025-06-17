// Home.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import useUserStore from '../store/userStore';
import MapDisplay from '../components/MapDisplay'; // MapDisplay 임포트
// SCHOOL_CODE_MAP 임포트는 이 코드에서는 사용되지 않으므로 제거하거나 그대로 두셔도 됩니다.
// import { SCHOOL_CODE_MAP } from '../utils/schoolCodeMap'; 

// 디자인 적용 시작 (이전 Google Maps Home.tsx의 스타일)
const Container = styled.div`
    width: 500px; /* 원본 400px에서 500px로 변경 */
    padding: 24px;
    margin: 0px; /* 원본 30px에서 0px로 변경 */
    border-radius: 16px;
    background-color: rgba(255, 255, 255, 0.95); /* 원본 #f0faff에서 변경 */
    box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
    font-family: "Pretendard"; /* 원본 "Pretendard", "Noto Sans KR", sans-serif에서 변경 */
    display: flex;
    flex-direction: column;
    gap: 15px;
`;

const Title = styled.h2`
    text-align: center;
    font-size: 24px;
    color: #007acc;
    margin-bottom: 10px;
`;

const Input = styled.input`
    padding: 10px;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid #a0d9ff;
    &:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.2);
    }
`;

const Button = styled.button`
    padding: 10px 15px;
    background-color: #007acc; /* 원본 #007acc 유지 */
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease; /* 원본 0.2s에서 0.3s로 변경 */
    &:hover {
        background-color: #005f99; /* 원본 #005fa3에서 변경 */
    }
    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;

const Message = styled.p`
    text-align: center;
    font-size: 16px;
    color: #555; /* 원본 #666에서 변경 */
    margin-top: 10px;
`;

const ResultContainer = styled.div`
    background-color: #e0f2ff; 
    border-radius: 8px;
    padding: 15px;
    margin-top: 15px; 
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid #a0d9ff;
`;

const ResultItem = styled.p`
    margin: 0; 
    font-size: 15px; 
    color: #333;
`;
// 디자인 적용 끝

const Home: React.FC = () => {
    const { userInfo } = useUserStore();
    const [startLocation, setStartLocation] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [routeInfo, setRouteInfo] = useState<{ duration: number; distance: number; } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 지도에 표시할 좌표 상태 추가
    const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null); // 출발지 (경도, 위도)
    const [endCoords, setEndCoords] = useState<{ x: number; y: number } | null>(null);   // 도착지 (경도, 위도)
    const [routePaths, setRoutePaths] = useState<{ x: number; y: number }[]>([]); // 경로를 그릴 좌표 배열

    const KAKAO_REST_API_KEY = import.meta.env.VITE_APP_KAKAO_REST_API_KEY;

    const handleSearchRoute = async () => {
        if (!startLocation) {
            setError('출발 위치를 입력해주세요.');
            return;
        }
        if (!userInfo || !userInfo.schoolLatitude || !userInfo.schoolLongitude) {
            setError('학교 정보가 설정되지 않았습니다. 설정 페이지에서 학교를 선택해주세요.');
            return;
        }

        console.log("userInfo:", userInfo);
        console.log("KAKAO_REST_API_KEY:", KAKAO_REST_API_KEY ? "키 존재" : "키 없음");


        setLoading(true);
        setError(null);
        setRouteInfo(null);
        setStartCoords(null); // 새로운 검색 전에 초기화
        setEndCoords(null);    // 새로운 검색 전에 초기화
        setRoutePaths([]);     // 새로운 검색 전에 초기화


        try {
            // 1. 출발지 주소를 위도/경도로 변환 (지오코딩)
            const geoResponse = await axios.get(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${startLocation}`,
                {
                    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
                }
            );

            console.log("카카오 주소 검색 응답:", geoResponse.data);

            if (geoResponse.data.documents.length === 0) {
                setError('입력하신 출발 주소를 찾을 수 없습니다.');
                setLoading(false);
                return;
            }

            const startCoordData = {
                x: parseFloat(geoResponse.data.documents[0].x), // 경도 (number로 변환)
                y: parseFloat(geoResponse.data.documents[0].y), // 위도 (number로 변환)
            };
            setStartCoords(startCoordData); // 출발지 좌표 저장
            setEndCoords({ x: userInfo.schoolLongitude, y: userInfo.schoolLatitude }); // 도착지 좌표 저장

            console.log("출발지 좌표 (경도, 위도):", startCoordData.x, startCoordData.y);


            // 2. 길찾기 API 호출 (대중교통)
            const routeResponse = await axios.get(
                'https://apis-navi.kakaomobility.com/v1/directions',
                {
                    params: {
                        origin: `${startCoordData.x},${startCoordData.y}`,
                        destination: `${userInfo.schoolLongitude},${userInfo.schoolLatitude}`,
                        priority: 'RECOMMEND', // 추천 경로
                    },
                    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
                }
            );

            console.log("카카오 길찾기 응답:", routeResponse.data);
            if (routeResponse.data.routes && routeResponse.data.routes.length > 0) {
                const route = routeResponse.data.routes[0];
                const durationMinutes = Math.ceil(route.summary.duration / 60);
                const distanceKm = (route.summary.distance / 1000).toFixed(1);

                setRouteInfo({ duration: durationMinutes, distance: parseFloat(distanceKm) });

                const extractedPaths: { x: number; y: number }[] = [];

                // ✨ routes[0].sections 배열을 확인하고 순회
                if (route.sections && Array.isArray(route.sections)) {
                    route.sections.forEach((section: any) => {
                        // sections 내부의 roads (또는 steps)를 찾아 vertexes 추출
                        // 대중교통 API가 'sections'를 반환하는 경우, 그 안의 상세 구조를 정확히 확인해야 합니다.
                        // 보통 section 내부에 'guides'나 'roads'가 있을 수 있습니다.
                        // 현재 응답에 sections만 있고 legs가 없다면, sections의 하위 구조를 확인해야 합니다.
                        // 개발자 도구 Network 탭에서 sections[0] 내부의 정확한 구조를 봐야 합니다.

                        // 임시로, sections[0] 아래에 바로 'roads'나 'vertexes'가 있다고 가정합니다.
                        // 이 부분은 실제 API 응답 구조를 보고 맞춰야 합니다!
                        if (section.roads && Array.isArray(section.roads)) {
                            section.roads.forEach((road: any) => {
                                if (road.vertexes && Array.isArray(road.vertexes)) {
                                    for (let i = 0; i < road.vertexes.length; i += 2) {
                                        extractedPaths.push({
                                            x: road.vertexes[i],
                                            y: road.vertexes[i + 1],
                                        });
                                    }
                                }
                            });
                        }
                        // 만약 sections 아래에 'steps'가 있다면 (legs처럼), 그 안에서 추출해야 합니다.
                        // if (section.steps && Array.isArray(section.steps)) { ... }
                    });
                } else if (route.legs && Array.isArray(route.legs)) {
                    // 혹시라도 legs가 있는 응답이 올 경우를 대비 (원래 의도했던 대중교통 API 구조)
                    route.legs.forEach((leg: any) => {
                        if (leg.steps && Array.isArray(leg.steps)) {
                            leg.steps.forEach((step: any) => {
                                if (step.roads && Array.isArray(step.roads)) {
                                    step.roads.forEach((road: any) => {
                                        if (road.vertexes && Array.isArray(road.vertexes)) {
                                            for (let i = 0; i < road.vertexes.length; i += 2) {
                                                extractedPaths.push({
                                                    x: road.vertexes[i],
                                                    y: road.vertexes[i + 1],
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

                setRoutePaths(extractedPaths);

                if (extractedPaths.length === 0) {
                    setError('경로 데이터가 추출되지 않았습니다. 대중교통 경로가 없거나 API 응답 구조가 예상과 다릅니다.');
                }

            } else {
                setError('경로를 찾을 수 없습니다.');
                setRoutePaths([]);
            }

        } catch (err: any) {
            console.error("길찾기 에러 상세:", err);

            if (axios.isAxiosError(err)) {
                if (err.response) {
                    console.error("에러 응답 데이터:", err.response.data);
                    console.error("에러 응답 상태:", err.response.status);
                    if (err.response.status === 401) {
                        setError('API 인증 실패. 카카오 REST API 키를 확인해주세요.');
                    } else if (err.response.status === 403) {
                        setError('API 권한 없음. 카카오 개발자 센터에 웹 플랫폼 등록 및 API 활성화를 확인해주세요.');
                    } else {
                        setError(`API 요청 실패: ${err.response.status} ${err.response.data.msg || err.response.data.message || ''}`);
                    }
                } else if (err.request) {
                    setError('네트워크 오류 또는 서버 응답이 없습니다.');
                } else {
                    setError('요청 설정 중 오류가 발생했습니다.');
                }
            } else {
                setError('알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Title>등하교 경로</Title> {/* Title 텍스트 변경 */}
            <Input
                type="text"
                placeholder="목적지 (예: 강원도 속초시 중앙동)" /* placeholder 텍스트 변경 */
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                disabled={loading}
            />
            <Button onClick={handleSearchRoute} disabled={loading || !startLocation}>
                {loading ? '경로 검색 중...' : '경로 검색'} {/* Button 텍스트 변경 */}
            </Button>

            {error && <Message style={{ color: 'red' }}>{error}</Message>}

            {routeInfo && (
                <ResultContainer>
                    <ResultItem>📍 예상 소요 시간: 약 {routeInfo.duration}분</ResultItem> 
                    <ResultItem>📏 총 거리: 약 {routeInfo.distance}km</ResultItem> 
                </ResultContainer>
            )}

            {(startCoords && endCoords) && (
                <MapDisplay
                    startCoords={startCoords}
                    endCoords={endCoords}
                    routePaths={routePaths}
                />
            )}
        </Container>
    );
};

export default Home;
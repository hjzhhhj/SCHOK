import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import useUserStore from '../store/userStore';
import MapDisplay from '../components/MapDisplay';

const Container = styled.div`
    width: 500px;
    padding: 24px;
    margin: 0px;
    border-radius: 16px;
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
    font-family: "Pretendard";
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

const ResultContainer = styled.div`
    margin-top: 20px;
    padding: 15px;
    border-top: 1px solid #e0e0e0;
`;

const ResultItem = styled.p`
    font-size: 16px;
    color: #333;
    margin-bottom: 8px;
`;

const Message = styled.p`
    text-align: center;
    color: #666;
    font-size: 16px;
    margin-top: 10px;
`;


const Home: React.FC = () => {
    const { userInfo } = useUserStore();
    const [startLocation, setStartLocation] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [routeInfo, setRouteInfo] = useState<{ duration: number; distance: number; } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null);
    const [endCoords, setEndCoords] = useState<{ x: number; y: number } | null>(null);
    const [routePaths, setRoutePaths] = useState<{ x: number; y: number }[]>([]);

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
        setStartCoords(null);
        setEndCoords(null);
        setRoutePaths([]);


        try {
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
                x: parseFloat(geoResponse.data.documents[0].x),
                y: parseFloat(geoResponse.data.documents[0].y),
            };
            setStartCoords(startCoordData);
            setEndCoords({ x: userInfo.schoolLongitude, y: userInfo.schoolLatitude });

            console.log("출발지 좌표 (경도, 위도):", startCoordData.x, startCoordData.y);


            const routeResponse = await axios.get(
                'https://apis-navi.kakao.com/v1/directions', // Corrected Kakao Mobility API endpoint
                {
                    params: {
                        origin: `${startCoordData.x},${startCoordData.y}`,
                        destination: `${userInfo.schoolLongitude},${userInfo.schoolLatitude}`,
                        priority: 'RECOMMEND',
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

                if (route.sections && Array.isArray(route.sections)) {
                    route.sections.forEach((section: any) => {
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
                    });
                } else if (route.legs && Array.isArray(route.legs)) {
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
            <Title>등교 경로 찾기</Title>
            <Input
                type="text"
                placeholder="출발지 주소 입력 (예: 서울특별시 강남구 역삼동)"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                disabled={loading}
            />
            <Button onClick={handleSearchRoute} disabled={loading || !startLocation}>
                {loading ? '경로 검색 중...' : '학교까지 길찾기'}
            </Button>

            {error && <Message style={{ color: 'red' }}>{error}</Message>}

            {routeInfo && (
                <ResultContainer>
                    <ResultItem>예상 소요 시간: 약 {routeInfo.duration}분</ResultItem>
                    <ResultItem>총 거리: 약 {routeInfo.distance}km</ResultItem>
                    <ResultItem>자세한 경로 정보는 지도에서 확인하세요.</ResultItem>
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
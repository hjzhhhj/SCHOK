// 출발지 주소를 입력받아 학교까지의 경로를 검색하고 지도에 표시하는 컴포넌트

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import useUserStore from '../store/userStore';
import MapDisplay from '../components/MapDisplay'; // 지도 컴포넌트 임포트

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
    position: relative; /* 추천 주소 목록 위치 지정을 위함 */
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
    background-color: #007acc;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    &:hover {
        background-color: #005f99;
    }
    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;

const Message = styled.p`
    text-align: center;
    font-size: 16px;
    color: #555;
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

const SuggestionList = styled.ul`
    position: absolute;
    top: calc(24px + 10px + 40px + 10px); /* Title 높이 + margin-bottom + Input 높이 + gap */
    left: 24px;
    right: 24px;
    background-color: white;
    border: 1px solid #a0d9ff;
    border-radius: 8px;
    list-style: none;
    padding: 0;
    margin: 0;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 128, 255, 0.1);
`;

const SuggestionItem = styled.li`
    padding: 10px;
    font-size: 16px;
    color: #333;
    cursor: pointer;
    &:hover {
        background-color: #e0f2ff;
    }
    &:not(:last-child) {
        border-bottom: 1px solid #f0f0f0;
    }
`;


const Home: React.FC = () => {
    const { userInfo, setUserInfo } = useUserStore(); 
    const [startLocation, setStartLocation] = useState<string>(''); 
    const [loading, setLoading] = useState<boolean>(false);
    const [routeInfo, setRouteInfo] = useState<{ duration: number; distance: number; } | null>(null); 
    const [error, setError] = useState<string | null>(null);

    const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null); 
    const [endCoords, setEndCoords] = useState<{ x: number; y: number } | null>(null);    
    const [routePaths, setRoutePaths] = useState<{ x: number; y: number }[]>([]);       
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false); 

    const [showHomeSuggestion, setShowHomeSuggestion] = useState<boolean>(false);

    const KAKAO_REST_API_KEY = import.meta.env.VITE_APP_KAKAO_REST_API_KEY;

    // MapDisplay 컴포넌트로부터 지도가 로드되었다는 콜백을 받음
    const handleMapLoaded = useCallback(() => {
        setIsMapLoaded(true);
    }, []);

    // 추천 주소 선택 시 입력 필드 업데이트
    const handleSelectHomeAddress = (address: string) => {
        setStartLocation(address);
        setShowHomeSuggestion(false);
    };

    // 경로 검색 처리 함수
    const handleSearchRoute = async () => {
        if (!startLocation) { setError('출발지를 입력해주세요.'); return; }
        if (!userInfo || !userInfo.schoolLatitude || !userInfo.schoolLongitude) {
            setError('학교 정보가 설정되지 않았습니다. 설정 페이지에서 학교를 선택해주세요.');
            return;
        }

        setLoading(true);
        setError(null);
        setRouteInfo(null);
        setStartCoords(null);
        setEndCoords(null);
        setRoutePaths([]);
        setShowHomeSuggestion(false);

        try {
            // 1. 출발지 주소를 좌표로 변환 (카카오 로컬 API)
            const geoResponse = await axios.get(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${startLocation}`,
                { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } }
            );

            if (geoResponse.data.documents.length === 0) {
                setError('입력하신 출발지 주소를 찾을 수 없습니다.');
                setLoading(false);
                return;
            }

            const startCoordData = {
                x: parseFloat(geoResponse.data.documents[0].x), // 경도
                y: parseFloat(geoResponse.data.documents[0].y), // 위도
            };
            setStartCoords(startCoordData);

            // 2. 학교 좌표를 도착지로 설정 (userInfo에서 가져옴)
            const schoolLatLng = {
                x: userInfo.schoolLongitude,
                y: userInfo.schoolLatitude,
            };
            setEndCoords(schoolLatLng);

            // 현재 입력된 출발지를 사용자 정보에 저장
            setUserInfo({ ...userInfo, homeAddress: startLocation });

            // 3. 카카오 길찾기 API 호출 (자동차 경로)
            const routeResponse = await axios.get(
                'https://apis-navi.kakaomobility.com/v1/directions',
                {
                    params: {
                        origin: `${startCoordData.x},${startCoordData.y}`,
                        destination: `${userInfo.schoolLongitude},${userInfo.schoolLatitude}`,
                        priority: 'RECOMMEND',
                    },
                    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
                }
            );

            // 길찾기 결과 처리
            if (routeResponse.data.routes && routeResponse.data.routes.length > 0) {
                const route = routeResponse.data.routes[0];
                const durationMinutes = Math.ceil(route.summary.duration / 60);
                const distanceKm = (route.summary.distance / 1000).toFixed(1);
                setRouteInfo({ duration: durationMinutes, distance: parseFloat(distanceKm) });

                // 경로 선을 그릴 좌표 추출
                const extractedPaths: { x: number; y: number }[] = [];
                route.sections.forEach((section: any) => {
                    section.roads.forEach((road: any) => {
                        for (let i = 0; i < road.vertexes.length; i += 2) {
                            extractedPaths.push({ x: road.vertexes[i], y: road.vertexes[i + 1] });
                        }
                    });
                });
                setRoutePaths(extractedPaths);

                if (extractedPaths.length === 0) {
                    setError('경로 데이터가 추출되지 않았습니다.');
                }
            } else {
                setError('경로를 찾을 수 없습니다.');
                setRoutePaths([]);
            }

        } catch (err: any) {
            console.error("길찾기 에러:", err); // 상세 에러 로깅
            if (axios.isAxiosError(err) && err.response) {
                setError(`API 요청 실패: ${err.response.status} ${err.response.data.msg || err.response.data.message || ''}`);
            } else {
                setError('경로 검색 중 알 수 없는 오류 발생.');
            }
        } finally {
            setLoading(false);
        }
    };

    // 버튼 활성화 조건 및 텍스트 설정
    const isButtonDisabled = loading || !startLocation || !isMapLoaded;
    const buttonText = loading ? '경로 검색 중...' : '학교까지 길찾기';

    return (
        <Container>
            <Title>등하교 경로</Title>
            <Input
                type="text"
                placeholder="출발지 도로명 주소 (예: 서울 강남구 테헤란로 134)"
                value={startLocation}
                onChange={(e) => {
                    setStartLocation(e.target.value);
                    if (e.target.value.length > 0) setShowHomeSuggestion(false);
                }}
                disabled={loading}
                onKeyPress={(e) => { if (e.key === 'Enter') handleSearchRoute(); }}
                onFocus={() => { if (userInfo?.homeAddress) setShowHomeSuggestion(true); }}
                onBlur={() => { setTimeout(() => setShowHomeSuggestion(false), 100); }}
            />

            {/* 추천 집 주소 목록 (사용자 정보에 주소가 있고, 입력 필드에 포커스 되었을 때) */}
            {showHomeSuggestion && userInfo?.homeAddress && (
                <SuggestionList>
                    <SuggestionItem onClick={() => handleSelectHomeAddress(userInfo.homeAddress!)}>
                        내 집: {userInfo.homeAddress}
                    </SuggestionItem>
                </SuggestionList>
            )}

            <Button onClick={handleSearchRoute} disabled={isButtonDisabled}>
                {buttonText}
            </Button>

            {error && <Message style={{ color: 'red' }}>{error}</Message>}

            {routeInfo && (
                <ResultContainer>
                    <ResultItem>📍 예상 소요 시간: 약 {routeInfo.duration}분</ResultItem>
                    <ResultItem>📏 총 거리: 약 {routeInfo.distance}km</ResultItem>
                </ResultContainer>
            )}

            {/* MapDisplay 컴포넌트 렌더링 */}
            <MapDisplay
                startCoords={startCoords}
                endCoords={endCoords}
                routePaths={routePaths}
                onMapLoaded={handleMapLoaded}
            />
            {/* 지도가 아직 로드되지 않았을 때 */}
            {!isMapLoaded && (
                <Message>지도를 불러오는 중입니다. 잠시만 기다려주세요...</Message>
            )}
        </Container>
    );
};

export default Home;
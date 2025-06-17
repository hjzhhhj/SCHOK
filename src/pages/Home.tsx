// 출발지 주소를 입력받아 학교까지의 경로를 검색하고 지도에 표시하는 컴포넌트

import React, { useState, useCallback, useEffect } from 'react'; // useEffect 추가
import styled from 'styled-components';
import axios from 'axios';
import useUserStore from '../store/userStore';
import MapDisplay from '../components/MapDisplay'; // 지도 컴포넌트 불러오기

// --- 스타일 컴포넌트 정의 ---
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
    position: relative;
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
    top: calc(24px + 24px + 10px + 40px + 15px);
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

// --- Home 컴포넌트 ---
const Home: React.FC = () => {
    const { userInfo, setUserInfo } = useUserStore(); // 사용자 정보 및 설정 함수 가져오기
    
    // 출발지 주소 입력 값 상태 (로컬 스토리지에서 초기값 불러오기)
    const [startLocation, setStartLocation] = useState<string>(() => {
        const savedLocation = localStorage.getItem('startLocation');
        return savedLocation || ''; // 저장된 값이 없으면 빈 문자열 반환
    });
    
    const [loading, setLoading] = useState<boolean>(false);         // 경로 검색 로딩 상태
    const [routeInfo, setRouteInfo] = useState<{ duration: number; distance: number; } | null>(null); // 경로 정보 (소요 시간, 거리)
    const [error, setError] = useState<string | null>(null);       // 오류 메시지

    const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null); // 출발지 좌표
    const [endCoords, setEndCoords] = useState<{ x: number; y: number } | null>(null);    // 도착지 (학교) 좌표
    const [routePaths, setRoutePaths] = useState<{ x: number; y: number }[]>([]);       // 지도에 그릴 경로 좌표들
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);                     // 지도 컴포넌트 로딩 완료 여부

    const [showHomeSuggestion, setShowHomeSuggestion] = useState<boolean>(false); // 집 주소 추천 목록 표시 여부

    const KAKAO_REST_API_KEY = import.meta.env.VITE_APP_KAKAO_REST_API_KEY; // 카카오 REST API 키

    // startLocation 값이 변경될 때마다 로컬 스토리지에 저장
    useEffect(() => {
        localStorage.setItem('startLocation', startLocation);
    }, [startLocation]); 

    // MapDisplay 컴포넌트로부터 지도가 로드되었다는 콜백을 받음
    const handleMapLoaded = useCallback(() => {
        setIsMapLoaded(true);
    }, []);

    // 추천 주소 선택 시 입력 필드 업데이트
    const handleSelectHomeAddress = (address: string) => {
        setStartLocation(address);
        setShowHomeSuggestion(false); // 추천 목록 숨기기
    };

    // 경로 검색 처리 함수
    const handleSearchRoute = async () => {
        // 필수 입력/설정 값 검증
        if (!startLocation) { 
            setError('출발지를 입력해주세요.'); 
            return; 
        }
        if (!userInfo || !userInfo.schoolLatitude || !userInfo.schoolLongitude) {
            setError('학교 정보가 설정되지 않았습니다. 설정 페이지에서 학교를 선택해주세요.');
            return;
        }

        // 상태 초기화 및 로딩 시작
        setLoading(true);
        setError(null);
        setRouteInfo(null);
        setStartCoords(null);
        setEndCoords(null);
        setRoutePaths([]);
        setShowHomeSuggestion(false); // 검색 시작 시 추천 목록 숨기기

        try {
            // 1. 출발지 주소를 좌표로 변환 (카카오 로컬 API 주소 검색)
            const geoResponse = await axios.get(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${startLocation}`,
                { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } }
            );

            // 검색 결과 없을 경우 에러 처리
            if (geoResponse.data.documents.length === 0) {
                setError('입력하신 출발지 주소를 찾을 수 없습니다.');
                setLoading(false);
                return;
            }

            // 출발지 좌표 추출
            const startCoordData = {
                x: parseFloat(geoResponse.data.documents[0].x), // 경도 (longitude)
                y: parseFloat(geoResponse.data.documents[0].y), // 위도 (latitude)
            };
            setStartCoords(startCoordData);

            // 2. 학교 좌표를 도착지로 설정 (userInfo에서 가져옴)
            const schoolLatLng = {
                x: userInfo.schoolLongitude,
                y: userInfo.schoolLatitude,
            };
            setEndCoords(schoolLatLng);

            // 현재 입력된 출발지를 사용자 정보에 저장 (추천 주소로 활용)
            // homeAddress는 선택 사항이므로, setUserInfo는 UserInfo의 모든 속성을 요구하지 않습니다.
            // userInfo가 null이 아니라고 가정하고 안전하게 업데이트합니다.
            if (userInfo) {
                setUserInfo({ ...userInfo, homeAddress: startLocation });
            }

            // 3. 카카오 길찾기 API 호출 (자동차 경로)
            const routeResponse = await axios.get(
                'https://apis-navi.kakaomobility.com/v1/directions',
                {
                    params: {
                        origin: `${startCoordData.x},${startCoordData.y}`,         // 출발지 좌표
                        destination: `${userInfo.schoolLongitude},${userInfo.schoolLatitude}`, // 도착지 좌표 (학교)
                        priority: 'RECOMMEND', // 추천 경로 기준
                    },
                    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
                }
            );

            // 길찾기 결과 처리
            if (routeResponse.data.routes && routeResponse.data.routes.length > 0) {
                const route = routeResponse.data.routes[0]; // 첫 번째 추천 경로 사용
                const durationMinutes = Math.ceil(route.summary.duration / 60); // 소요 시간을 분 단위로 변환 (올림)
                const distanceKm = (route.summary.distance / 1000).toFixed(1); // 거리를 km 단위로 변환 (소수점 첫째 자리)
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

                // 추출된 경로가 없을 경우 에러 메시지 표시
                if (extractedPaths.length === 0) {
                    setError('경로 데이터가 추출되지 않았습니다.');
                }
            } else {
                // 길찾기 결과가 없을 경우 에러 메시지 표시
                setError('경로를 찾을 수 없습니다.');
                setRoutePaths([]); // 경로 데이터 초기화
            }

        } catch (err: any) {
            // API 요청 실패 시 에러 처리
            console.error("길찾기 에러:", err); // 상세 에러 로깅
            if (axios.isAxiosError(err) && err.response) {
                // Axios 에러일 경우 응답 메시지 사용
                setError(`API 요청 실패: ${err.response.status} ${err.response.data.msg || err.response.data.message || ''}`);
            } else {
                // 그 외 알 수 없는 에러
                setError('경로 검색 중 알 수 없는 오류 발생.');
            }
        } finally {
            setLoading(false); // 로딩 종료
        }
    };

    // 버튼 활성화 조건 및 텍스트 설정
    const isButtonDisabled = loading || !startLocation || !isMapLoaded; // 로딩 중이거나, 출발지 없거나, 지도 미로드 시 버튼 비활성화
    const buttonText = loading ? '경로 검색 중...' : '학교까지 길찾기'; // 버튼 텍스트 변경

    return (
        <Container>
            <Title>☁️ 등교 경로 찾기 ☁️</Title>
            <Input
                type="text"
                placeholder="도로명 주소 (예: 강원특별자치도 속초시 중앙로 183)"
                value={startLocation}
                onChange={(e) => {
                    setStartLocation(e.target.value);
                    if (e.target.value.length > 0) setShowHomeSuggestion(false); // 입력 시 추천 목록 숨기기
                }}
                disabled={loading} // 로딩 중일 때 입력 비활성화
                onKeyPress={(e) => { if (e.key === 'Enter') handleSearchRoute(); }} // 엔터 키로 검색 실행
                onFocus={() => { if (userInfo?.homeAddress) setShowHomeSuggestion(true); }} // 입력 필드 포커스 시 추천 목록 표시 (집 주소가 있을 경우)
                onBlur={() => { setTimeout(() => setShowHomeSuggestion(false), 100); }} // 포커스 아웃 시 추천 목록 숨기기 (클릭 이벤트 처리 위해 딜레이)
            />

            {/* 추천 집 주소 목록 (사용자 정보에 집 주소가 있고, 추천 목록 표시가 활성화되었을 때) */}
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

            {/* 오류 메시지 표시 */}
            {error && <Message style={{ color: 'red' }}>{error}</Message>}

            {/* 경로 검색 결과 표시 */}
            {routeInfo && (
                <ResultContainer>
                    <ResultItem>📍 예상 소요 시간: 약 {routeInfo.duration}분</ResultItem>
                    <ResultItem>📏 총 거리: 약 {routeInfo.distance}km</ResultItem>
                </ResultContainer>
            )}

            {/* 지도 컴포넌트 렌더링 */}
            <MapDisplay
                startCoords={startCoords}
                endCoords={endCoords}
                routePaths={routePaths}
                onMapLoaded={handleMapLoaded} // 지도 로딩 완료 콜백 전달
            />
            {/* 지도가 아직 로드되지 않았을 때 메시지 */}
            {!isMapLoaded && (
                <Message>지도를 불러오는 중입니다. 잠시만 기다려주세요...</Message>
            )}
        </Container>
    );
};

export default Home;
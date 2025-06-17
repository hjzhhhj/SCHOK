import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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
    background-color: #007acc;
    color: white;
    font-size: 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
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
    font-size: 14px;
    color: #555;
`;

const ResultContainer = styled.div`
    background-color: #e0f2ff;
    padding: 15px;
    border-radius: 12px;
    margin-top: 10px;
    box-shadow: inset 0 2px 4px rgba(0, 128, 255, 0.1);
`;

const ResultItem = styled.p`
    margin: 5px 0;
    font-size: 16px;
    color: #005f99;
    &:first-child {
        font-weight: bold;
    }
`;

const Home: React.FC = () => {
    const [startLocation, setStartLocation] = useState<string>('');
    const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null);
    const [endCoords, setEndCoords] = useState<{ x: number; y: number } | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ duration: string; distance: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState<boolean>(false);
    
    const { userInfo } = useUserStore();

    // userInfo.schoolLocation이 변경될 때마다 endCoords 설정
    useEffect(() => {
        if (userInfo?.schoolLatitude && userInfo?.schoolLongitude) {
            setEndCoords({ x: userInfo.schoolLongitude, y: userInfo.schoolLatitude });
        } else {
            // 앱 로드 시 즉시 에러를 표시하지 않고,
            // 'searchRoute' 시점에 endCoords가 없으면 에러를 띄웁니다.
            setEndCoords(null); 
        }
    }, [userInfo]);

    // Google Maps API 로드 상태를 감지하는 useEffect
    useEffect(() => {
        const checkGoogleMaps = setInterval(() => {
            if (window.google && window.google.maps) {
                setIsGoogleMapsLoaded(true);
                clearInterval(checkGoogleMaps);
                console.log("Google Maps API 로드 완료!");
            }
        }, 500); // 0.5초마다 확인

        return () => clearInterval(checkGoogleMaps); // 컴포넌트 언마운트 시 클린업
    }, []);

    // 경로 검색 및 Geocoding을 수행하는 함수
    const searchRoute = async () => {
        setError(null); // 에러 메시지 초기화
        setLoading(true);
        setRouteInfo(null); 
        setStartCoords(null); 

        if (!startLocation.trim()) {
            setError('출발지 주소를 입력해주세요.');
            setLoading(false);
            return;
        }
        if (!endCoords) {
            setError('학교 위치 정보가 없습니다. 설정 페이지에서 학교 정보를 입력해주세요.');
            setLoading(false);
            return;
        }

        if (!isGoogleMapsLoaded) {
            // 이 메시지는 버튼 클릭 시에만 나타나도록 이미 조치되었습니다.
            // 버튼 자체도 isGoogleMapsLoaded에 따라 비활성화되므로, 이 경우는 발생 확률이 낮아집니다.
            setError("Google Maps 서비스가 아직 로드되지 않았습니다. 잠시 기다려주세요.");
            setLoading(false);
            return;
        }

        const geocoder = new window.google.maps.Geocoder();
        
        try {
            const geocodeResponse = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address: startLocation }, (
                    results: google.maps.GeocoderResult[] | null,
                    status: google.maps.GeocoderStatus
                ) => {
                    if (status === window.google.maps.GeocoderStatus.OK && results) {
                        resolve(results);
                    } else {
                        reject(new Error(`Geocoding request failed: ${status}`));
                    }
                });
            });

            if (geocodeResponse.length > 0) {
                const originLocation = geocodeResponse[0].geometry.location;
                setStartCoords({ y: originLocation.lat(), x: originLocation.lng() });
                setError(null); 
            } else {
                setError('입력하신 주소를 찾을 수 없습니다. 다시 확인해주세요.');
                console.error('Geocode request failed: ZERO_RESULTS');
            }

        } catch (error: any) {
            console.error('Geocoding 에러 상세:', error);
            if (error.message.includes('REQUEST_DENIED')) {
                setError('Google API 키 문제가 발생했습니다. 키 및 API 설정을 확인해주세요.');
            } else if (error.message.includes('ZERO_RESULTS')) {
                setError('입력하신 주소를 찾을 수 없습니다.');
            } else if (error.message.includes('OVER_QUERY_LIMIT')) {
                 setError('API 사용량이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            } else {
                setError(`주소 변환 실패: ${error.message}`);
            }
            setStartCoords(null);
        } finally {
            setLoading(false);
        }
    };

    // 버튼 활성화/비활성화 조건
    const isButtonDisabled = loading || !startLocation.trim() || !endCoords || !isGoogleMapsLoaded;
    const buttonText = loading ? '경로 검색 중...' : 
                       !endCoords ? '학교 위치 정보 필요' : // 학교 위치 정보가 없으면 버튼에 표시
                       !isGoogleMapsLoaded ? '지도 로딩 중...' : '학교까지 길찾기';


    return (
        <Container>
            <Title>등교 경로 찾기</Title>
            <Input
                type="text"
                placeholder="출발지 주소 입력 (예: 서울특별시 강남구 테헤란로 123)"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                disabled={loading || !isGoogleMapsLoaded || !endCoords} // 학교 정보 없으면 입력 비활성화
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isButtonDisabled) {
                        searchRoute();
                    }
                }}
            />
            <Button onClick={searchRoute} disabled={isButtonDisabled}>
                {buttonText}
            </Button>

            {/* 에러 메시지는 경로 검색 시에만 표시되도록 합니다. */}
            {error && <Message style={{ color: 'red' }}>{error}</Message>}

            {routeInfo && (
                <ResultContainer>
                    <ResultItem>📍 예상 소요 시간: 약 {routeInfo.duration}</ResultItem>
                    <ResultItem>📏 총 거리: 약 {routeInfo.distance}</ResultItem>
                    <ResultItem>🗺️ 자세한 경로 정보는 아래 지도에서 확인하세요.</ResultItem>
                </ResultContainer>
            )}

            {/* MapDisplay는 isGoogleMapsLoaded가 true이고, 좌표가 있을 때만 렌더링합니다. */}
            {isGoogleMapsLoaded && (startCoords || (userInfo?.schoolLatitude && userInfo?.schoolLongitude)) && (
                <MapDisplay
                    startCoords={startCoords}
                    endCoords={endCoords}
                    onRouteCalculated={(duration, distance) => {
                        setRouteInfo({ duration: duration, distance: distance });
                    }}
                />
            )}
            {/* MapDisplay가 로드되지 않았다면 지도 로딩 메시지를 표시할 수 있습니다. 
                이 메시지는 MapDisplay가 렌더링될 공간에 위치하도록 조정하는 것이 좋습니다.
                현재는 MapDisplay가 렌더링되지 않을 때만 보이도록 했습니다. */}
            {!isGoogleMapsLoaded && (
                <Message>지도를 불러오는 중입니다. 잠시만 기다려주세요...</Message>
            )}
        </Container>
    );
};

export default Home;
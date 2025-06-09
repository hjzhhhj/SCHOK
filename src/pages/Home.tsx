import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import useUserStore from '../store/userStore';

const Container = styled.div`
    width: 400px;
    margin: 30px;
    padding: 24px;
    border-radius: 16px;
    background-color: #f0faff;
    box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
    font-family: "Pretendard", "Noto Sans KR", sans-serif;
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

// 아래 Message styled component를 추가합니다.
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

        setLoading(true);
        setError(null);
        setRouteInfo(null);

        try {
            // 1. 출발지 주소를 위도/경도로 변환 (지오코딩)
            const geoResponse = await axios.get(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${startLocation}`,
                {
                    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
                }
            );

            if (geoResponse.data.documents.length === 0) {
                setError('입력하신 출발 주소를 찾을 수 없습니다.');
                setLoading(false);
                return;
            }

            const startCoords = {
                x: geoResponse.data.documents[0].x, // 경도
                y: geoResponse.data.documents[0].y, // 위도
            };

            // 2. 길찾기 API 호출 (대중교통)
            const routeResponse = await axios.get(
                'https://apis-navi.kakaomobility.com/v1/directions',
                {
                    params: {
                        origin: `${startCoords.x},${startCoords.y}`,
                        destination: `${userInfo.schoolLongitude},${userInfo.schoolLatitude}`,
                        priority: 'RECOMMEND', // 추천 경로
                    },
                    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
                }
            );

            if (routeResponse.data.routes && routeResponse.data.routes.length > 0) {
                const route = routeResponse.data.routes[0];
                const durationMinutes = Math.ceil(route.summary.duration / 60); // 초를 분으로 변환 후 올림
                const distanceKm = (route.summary.distance / 1000).toFixed(1); // 미터를 km로 변환 후 소수점 1자리

                setRouteInfo({ duration: durationMinutes, distance: parseFloat(distanceKm) });
            } else {
                setError('경로를 찾을 수 없습니다.');
            }

        } catch (err) {
            console.error("길찾기 에러:", err);
            setError('경로를 가져오는 중 오류가 발생했습니다.');
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
                    <ResultItem>자세한 경로 정보는 다음 단계에서 지도에 표시됩니다.</ResultItem>
                </ResultContainer>
            )}
        </Container>
    );
};

export default Home;
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

declare global {
  interface Window {
    kakao: any;
  }
}

const MapContainer = styled.div`
  width: 600px; /* 지도의 너비 */
  height: 400px; /* 지도의 높이 */
  margin: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
`;

interface MapDisplayProps {
  startCoords: { x: number; y: number } | null; // 출발지 (경도, 위도)
  endCoords: { x: number; y: number } | null;   // 도착지 (경도, 위도)
  routePaths: { x: number; y: number }[];       // 경로 좌표 배열 (경도, 위도)
}

const MapDisplay: React.FC<MapDisplayProps> = ({ startCoords, endCoords, routePaths }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null); // 지도 인스턴스를 저장할 ref

  useEffect(() => {
    // 카카오맵 SDK가 로드되었는지 확인
    if (window.kakao && mapRef.current) {
      const options = {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // 기본 중심 (서울 시청)
        level: 3, // 지도의 확대 레벨
      };

      mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);

      // 출발지/도착지 또는 경로가 있을 경우 지도를 그립니다.
      if (startCoords && endCoords) {
        const startLatLng = new window.kakao.maps.LatLng(startCoords.y, startCoords.x);
        const endLatLng = new window.kakao.maps.LatLng(endCoords.y, endCoords.x);

        const startMarker = new window.kakao.maps.Marker({
          position: startLatLng,
          map: mapInstance.current,
          title: '출발지',
        });

        const endMarker = new window.kakao.maps.Marker({
          position: endLatLng,
          map: mapInstance.current,
          title: '도착지',
        });

        // 경로 폴리라인 그리기
        if (routePaths.length > 0) {
          const linePath = routePaths.map(coord => new window.kakao.maps.LatLng(coord.y, coord.x));
          const polyline = new window.kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 5,
            strokeColor: '#FF0000',
            strokeOpacity: 0.7,
            strokeStyle: 'solid',
          });
          polyline.setMap(mapInstance.current);

          // 경로 전체가 보이도록 지도 중심과 확대 레벨 조정
          const bounds = new window.kakao.maps.LatLngBounds();
          linePath.forEach(latlng => bounds.extend(latlng));
          mapInstance.current.setBounds(bounds);
        } else {
            // 경로가 없으면 출발지와 도착지를 포함하는 바운드 설정
            const bounds = new window.kakao.maps.LatLngBounds();
            bounds.extend(startLatLng);
            bounds.extend(endLatLng);
            mapInstance.current.setBounds(bounds);
        }
      }
    }
  }, [startCoords, endCoords, routePaths]); // 의존성 배열에 변경될 값들을 포함

  return <MapContainer ref={mapRef} />;
};

export default MapDisplay;
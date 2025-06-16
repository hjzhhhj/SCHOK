import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

declare global {
  interface Window {
    kakao: any;
  }
}

const MapContainer = styled.div`
  width: 400px; 
  height: 400px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
`;

interface MapDisplayProps {
  startCoords: { x: number; y: number } | null;
  endCoords: { x: number; y: number } | null;
  routePaths: { x: number; y: number }[];
}

const MapDisplay: React.FC<MapDisplayProps> = ({ startCoords, endCoords, routePaths }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    console.log("MapDisplay useEffect 실행됨");
    console.log("window.kakao (at useEffect start):", window.kakao);
    console.log("mapRef.current (at useEffect start):", mapRef.current);

    if (window.kakao && mapRef.current) {
      console.log("카카오맵 지도 초기화 시도 중...");
      const options = {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // Default center (Seoul City Hall)
        level: 3,
      };

      mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);
      console.log("카카오맵 지도 인스턴스 생성됨:", mapInstance.current);

      if (startCoords && endCoords) {
        console.log("startCoords (y,x):", startCoords.y, startCoords.x);
        console.log("endCoords (y,x):", endCoords.y, endCoords.x);

        const startLatLng = new window.kakao.maps.LatLng(startCoords.y, startCoords.x);
        const endLatLng = new window.kakao.maps.LatLng(endCoords.y, endCoords.x);

        console.log("startLatLng 생성됨:", startLatLng);
        console.log("endLatLng 생성됨:", endLatLng);

        // Marker creation
        const startMarker = new window.kakao.maps.Marker({
          position: startLatLng,
          map: mapInstance.current,
          title: '출발지',
        });
        console.log("startMarker 생성됨:", startMarker);

        const endMarker = new window.kakao.maps.Marker({
          position: endLatLng,
          map: mapInstance.current,
          title: '도착지',
        });
        console.log("endMarker 생성됨:", endMarker);

        if (routePaths.length > 0) {
          console.log("경로 데이터 있음, 폴리라인 그리기 시도...");
          const linePath = routePaths.map(coord => new window.kakao.maps.LatLng(coord.y, coord.x));
          const polyline = new window.kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 5,
            strokeColor: '#FF0000',
            strokeOpacity: 0.7,
            strokeStyle: 'solid',
          });
          polyline.setMap(mapInstance.current);

          const bounds = new window.kakao.maps.LatLngBounds();
          linePath.forEach(latlng => bounds.extend(latlng));
          mapInstance.current.setBounds(bounds);
          console.log("폴리라인 및 지도 바운드 설정 완료.");
        } else {
            console.log("경로 데이터 없음 (routePaths empty). 출발지/도착지 중심으로 지도 설정.");
            const bounds = new window.kakao.maps.LatLngBounds();
            bounds.extend(startLatLng);
            bounds.extend(endLatLng);
            mapInstance.current.setBounds(bounds);
        }
      } else {
        console.log("startCoords 또는 endCoords가 유효하지 않아 마커/경로를 그릴 수 없음.");
      }
    } else {
        console.log("카카오맵 SDK 로드 또는 mapRef.current 문제 (else 블록):", { kakaoLoaded: !!window.kakao, mapRefCurrent: !!mapRef.current });
    }
  }, [startCoords, endCoords, routePaths]);

  return <MapContainer ref={mapRef} />;
};

export default MapDisplay;
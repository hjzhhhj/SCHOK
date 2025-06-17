// 카카오맵을 초기화하고, 출발지/도착지 마커 및 경로를 표시하는 컴포넌트

import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

declare global {
  interface Window {
    kakao: any; // 카카오맵 API 객체
  }
}

const MapContainer = styled.div`
  width: auto;
  height: 400px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
`;

interface MapDisplayProps {
  startCoords: { x: number; y: number } | null;
  endCoords: { x: number; y: number } | null;
  routePaths: { x: number; y: number }[]; // 경로 좌표 배열
  onMapLoaded: () => void; // 지도 로드 완료 시 호출될 콜백
}

const MapDisplay: React.FC<MapDisplayProps> = ({ startCoords, endCoords, routePaths, onMapLoaded }) => {
  const mapRef = useRef<HTMLDivElement>(null); // 지도가 그려질 DOM 요소
  const mapInstance = useRef<any>(null); // 카카오맵 인스턴스
  const scriptLoaded = useRef(false); // 카카오맵 스크립트 로드 여부
  const mapInitialized = useRef(false); // 지도 초기화 여부

  // 지도 기본 중심 좌표
  const defaultCenter = new window.kakao.maps.LatLng(38.207128, 128.591905);

  // 카카오맵 초기화 및 onMapLoaded 콜백 호출
  const initializeMap = useCallback(() => {
    if (mapInitialized.current || !mapRef.current || !window.kakao) {
      return;
    }
    mapInstance.current = new window.kakao.maps.Map(mapRef.current, { center: defaultCenter, level: 3 });
    mapInitialized.current = true;
    onMapLoaded();
  }, [onMapLoaded, defaultCenter]);

  // 컴포넌트 마운트 시 카카오맵 스크립트 로드
  useEffect(() => {
    const loadKakaoMapScript = () => {
      if (scriptLoaded.current || document.getElementById('kakao-map-sdk')) {
        if (window.kakao && !mapInitialized.current) {
            initializeMap();
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'kakao-map-sdk';
      const KAKAO_JAVASCRIPT_KEY = import.meta.env.VITE_APP_KAKAO_JAVASCRIPT_KEY;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JAVASCRIPT_KEY}&libraries=services,clusterer,drawing&autoload=false`;
      script.async = true;
      script.defer = true;

      document.head.appendChild(script);
      scriptLoaded.current = true;

      script.onload = () => { window.kakao.maps.load(initializeMap); };
      script.onerror = () => {
        console.error('카카오맵 스크립트 로드 실패');
        scriptLoaded.current = false;
      };
    };
    loadKakaoMapScript();
  }, [initializeMap]);

  // 출발/도착 좌표 또는 경로 변경 시 지도 업데이트
  useEffect(() => {
    if (mapInitialized.current && mapInstance.current) {
        // 기존 마커 및 폴리라인 제거
        if (mapInstance.current.markers) {
            mapInstance.current.markers.forEach((marker: any) => marker.setMap(null));
            mapInstance.current.markers = [];
        }
        if (mapInstance.current.polyline) {
            mapInstance.current.polyline.setMap(null);
            mapInstance.current.polyline = null;
        }

        if (startCoords && endCoords) {
            const startLatLng = new window.kakao.maps.LatLng(startCoords.y, startCoords.x);
            const endLatLng = new window.kakao.maps.LatLng(endCoords.y, endCoords.x);

            // 출발/도착 마커 추가
            const startMarker = new window.kakao.maps.Marker({ position: startLatLng, map: mapInstance.current, title: '출발지' });
            const endMarker = new window.kakao.maps.Marker({ position: endLatLng, map: mapInstance.current, title: '도착지' });
            if (!mapInstance.current.markers) mapInstance.current.markers = [];
            mapInstance.current.markers.push(startMarker, endMarker);

            // 경로 폴리라인 그리기 및 지도 영역 설정
            if (routePaths && routePaths.length > 0) {
                const linePath = routePaths.map(coord => new window.kakao.maps.LatLng(coord.y, coord.x));
                const polyline = new window.kakao.maps.Polyline({
                    path: linePath,
                    strokeWeight: 5,
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.7,
                    strokeStyle: 'solid',
                });
                polyline.setMap(mapInstance.current);
                mapInstance.current.polyline = polyline;

                const bounds = new window.kakao.maps.LatLngBounds();
                linePath.forEach(latlng => bounds.extend(latlng));
                mapInstance.current.setBounds(bounds);
            } else {
                // 경로가 없을 경우, 마커 기반으로 지도 영역 설정
                const bounds = new window.kakao.maps.LatLngBounds();
                bounds.extend(startLatLng);
                bounds.extend(endLatLng);
                mapInstance.current.setBounds(bounds);
            }
        } else {
            // 좌표 없을 시, 지도를 기본 중심으로 재설정
            mapInstance.current.setCenter(defaultCenter);
            mapInstance.current.setLevel(3);
        }
    }
  }, [startCoords, endCoords, routePaths, mapInitialized.current, defaultCenter]);

  return <MapContainer ref={mapRef} />;
};

export default MapDisplay;
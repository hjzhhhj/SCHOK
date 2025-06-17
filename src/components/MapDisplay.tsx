import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

declare global {
  interface Window {
    initMap?: () => void;
    google?: any;
  }
}

const MapContainer = styled.div`
  width: auto;
  height: 350px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);\
`;

interface MapDisplayProps {
  startCoords: { x: number; y: number } | null;
  endCoords: { x: number; y: number } | null;
  onRouteCalculated?: (duration: string, distance: string) => void;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ startCoords, endCoords, onRouteCalculated }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const scriptLoaded = useRef<boolean>(false);

  // initializeMap 함수를 useEffect 밖으로 빼고, 필요한 의존성을 추가합니다.
  // 이 함수는 Google Maps 스크립트가 로드된 후에만 호출되어야 합니다.
  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      console.error("Map container ref is not available.");
      return;
    }

    if (mapInstance.current) {
      // 이미 지도가 초기화되었다면 다시 초기화하지 않습니다.
      return;
    }

    // window.google이 유효한지 다시 한번 확인
    if (!window.google || !window.google.maps) {
      console.warn("Google Maps API is not yet available for map initialization.");
      return;
    }

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 38.204, lng: 128.58 }, // 초기 중심 좌표 (예시)
      zoom: 12,
      disableDefaultUI: true, // 기본 UI 비활성화 (확대/축소 컨트롤 등)
      gestureHandling: "greedy", // 모바일에서 한 손가락 스크롤 허용
    });

    directionsService.current = new window.google.maps.DirectionsService();
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: mapInstance.current,
      polylineOptions: {
        strokeColor: '#007acc', // 경로 선 색상
        strokeOpacity: 0.8,
        strokeWeight: 6
      }
    });

    console.log('🗺️ Google Map initialized!');
  }, []); // initializeMap 함수는 직접적인 외부 의존성이 없으므로 빈 배열을 유지합니다.


  // 스크립트 로딩을 담당하는 useEffect
  useEffect(() => {
    // 스크립트가 이미 로드되었거나, window.google.maps가 이미 존재하면 스크립트를 다시 추가하지 않습니다.
    if (scriptLoaded.current || window.google?.maps) {
        if (window.google?.maps && !mapInstance.current) {
            // 스크립트는 로드되었지만 지도가 초기화되지 않았다면, 지도를 초기화합니다.
            initializeMap();
        }
        return;
    }

    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_APP_Maps_API_KEY;

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('✅ Google Maps script loaded!');
      scriptLoaded.current = true; // 스크립트 로드 성공 시 플래그 설정
      initializeMap(); // 스크립트 로드 완료 후 지도 초기화
    };

    script.onerror = () => {
      console.error('❌ Google Maps script failed to load');
      scriptLoaded.current = false; // 로드 실패 시 플래그 유지 (선택 사항)
    };

    document.head.appendChild(script);

    // 컴포넌트 언마운트 시 스크립트 제거 (선택 사항)
    return () => {
        if (document.head.contains(script)) {
            document.head.removeChild(script);
            scriptLoaded.current = false; // 상태 초기화
        }
    };
  }, [initializeMap]); // initializeMap 함수가 useCallback으로 감싸져 있으므로 여기에 포함해도 무방합니다.

  // 경로 계산 및 렌더링을 담당하는 useEffect
  useEffect(() => {
    if (mapInstance.current && startCoords && endCoords && directionsService.current && directionsRenderer.current) {
      // 경로 계산 및 렌더링 로직 (기존 코드 유지)
      const origin = new window.google.maps.LatLng(startCoords.x, startCoords.y);
      const destination = new window.google.maps.LatLng(endCoords.x, endCoords.y);

      const request = {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.TRANSIT, // 대중교통
      };

      directionsService.current.route(request, (response: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.current?.setDirections(response);

          const route = response.routes[0].legs[0];
          const duration = route.duration.text;
          const distance = route.distance.text;

          if (onRouteCalculated) {
            onRouteCalculated(duration, distance);
          }
          mapInstance.current?.fitBounds(response.routes[0].bounds);
        } else if (status === window.google.maps.DirectionsStatus.ZERO_RESULTS) {
            console.error('Google Directions API 응답에 경로가 없습니다. (ZERO_RESULTS)');
            if (onRouteCalculated) {
                onRouteCalculated('N/A', 'N/A');
            }
        } else {
          console.error(`Google Directions API 요청 실패: ${status}`);
          if (onRouteCalculated) {
              onRouteCalculated('N/A', 'N/A');
          }
        }
      });
    }
  }, [mapInstance.current, directionsService.current, directionsRenderer.current, startCoords, endCoords, onRouteCalculated]);

  return (
    <MapContainer ref={mapRef} />
  );
};

export default MapDisplay;
import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

// 전역 window 객체에 kakao 타입 추가
declare global {
  interface Window {
    kakao: any;
  }
}

// 지도 컨테이너 스타일 정의
const MapContainer = styled.div`
  width: auto;
  height: 300px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.1);
`;

// MapDisplay 컴포넌트 Props 타입 정의
interface MapDisplayProps {
  startCoords: { x: number; y: number } | null; // 출발지 좌표 (x: 경도, y: 위도)
  endCoords: { x: number; y: number } | null;     // 도착지 좌표 (x: 경도, y: 위도)
  routePaths: { x: number; y: number }[];       // 경로 좌표 배열
  onMapLoaded: () => void;                       // 지도 로딩 완료 시 호출될 콜백 함수
}

const MapDisplay: React.FC<MapDisplayProps> = ({ startCoords, endCoords, routePaths, onMapLoaded }) => {
  const mapRef = useRef<HTMLDivElement>(null); // 지도를 표시할 DOM 엘리먼트 참조
  const mapInstance = useRef<any>(null);      // 카카오맵 인스턴스 참조
  const scriptLoaded = useRef(false);         // 카카오맵 스크립트 로딩 여부
  const mapInitialized = useRef(false);       // 지도 초기화 완료 여부

  // 기본 지도 중심 좌표 반환
  const getDefaultCenter = () => {
    if (window.kakao && window.kakao.maps) {
      // 강원특별자치도 속초시청 기본 좌표
      return new window.kakao.maps.LatLng(38.207128, 128.591905);
    }
    return null;
  };

  // 지도 초기화 함수
  const initializeMap = useCallback(() => {
    // 이미 초기화되었거나, 지도 엘리먼트 또는 카카오맵 객체가 없으면 중단
    if (mapInitialized.current || !mapRef.current || !window.kakao || !window.kakao.maps) return;

    const defaultCenter = getDefaultCenter();
    if (!defaultCenter) return;

    // 새 지도 인스턴스 생성 및 참조 저장
    mapInstance.current = new window.kakao.maps.Map(mapRef.current, { center: defaultCenter, level: 3 });
    mapInitialized.current = true;
    onMapLoaded(); // 지도 로딩 완료 콜백 호출
  }, [onMapLoaded]);

  // 카카오맵 스크립트 로드 및 지도 초기화
  useEffect(() => {
    // 스크립트가 이미 로드되었으면 바로 지도 초기화 시도
    if (scriptLoaded.current) {
      if (window.kakao && !mapInitialized.current) {
        initializeMap();
      }
      return;
    }

    // 문서에 스크립트가 이미 있다면 로드된 것으로 간주
    if (document.getElementById('kakao-map-sdk')) {
      scriptLoaded.current = true;
      if (window.kakao && !mapInitialized.current) initializeMap();
      return;
    }

    // 카카오맵 스크립트 동적 생성 및 로드
    const script = document.createElement('script');
    script.id = 'kakao-map-sdk';
    const KAKAO_JAVASCRIPT_KEY = import.meta.env.VITE_APP_KAKAO_JAVASCRIPT_KEY; // .env 파일에서 앱 키 가져오기
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JAVASCRIPT_KEY}&libraries=services,clusterer,drawing&autoload=false`;
    script.async = true;
    script.defer = true;

    // 스크립트 로드 완료 시 지도 초기화 함수 호출
    script.onload = () => {
      scriptLoaded.current = true;
      window.kakao.maps.load(initializeMap);
    };

    // 스크립트 로드 실패 시 에러 로깅
    script.onerror = () => {
      console.error('❌ 카카오맵 스크립트 로드 실패. 인터넷 연결 또는 앱 키 확인!');
      scriptLoaded.current = false;
    };

    // 스크립트를 head에 추가하여 로드 시작
    document.head.appendChild(script);
  }, [initializeMap]);

  // 출발지, 도착지, 경로가 변경될 때마다 지도에 표시 업데이트
  useEffect(() => {
    // 지도가 초기화되지 않았다면 중단
    if (!mapInitialized.current || !mapInstance.current) return;

    // 기존 마커와 폴리라인이 있다면 모두 지도에서 제거
    if (mapInstance.current.markers) {
      mapInstance.current.markers.forEach((marker: any) => marker.setMap(null));
      mapInstance.current.markers = [];
    }
    if (mapInstance.current.polyline) {
      mapInstance.current.polyline.setMap(null);
      mapInstance.current.polyline = null;
    }

    // 출발지, 도착지 좌표가 모두 있을 경우 마커 및 경로 표시
    if (startCoords && endCoords) {
      const startLatLng = new window.kakao.maps.LatLng(startCoords.y, startCoords.x); // 출발지 LatLng 객체 생성
      const endLatLng = new window.kakao.maps.LatLng(endCoords.y, endCoords.x);     // 도착지 LatLng 객체 생성

      // 출발지 마커 생성 및 지도에 표시
      const startMarker = new window.kakao.maps.Marker({
        position: startLatLng,
        map: mapInstance.current,
        title: '출발지',
      });
      // 도착지 마커 생성 및 지도에 표시
      const endMarker = new window.kakao.maps.Marker({
        position: endLatLng,
        map: mapInstance.current,
        title: '도착지',
      });

      // 마커 목록에 추가 (재사용을 위해)
      if (!mapInstance.current.markers) mapInstance.current.markers = [];
      mapInstance.current.markers.push(startMarker, endMarker);

      // 경로 좌표가 있고 길이가 0보다 클 경우 폴리라인으로 경로 표시
      if (routePaths && routePaths.length > 0) {
        const linePath = routePaths.map(coord => new window.kakao.maps.LatLng(coord.y, coord.x));
        const polyline = new window.kakao.maps.Polyline({
          path: linePath,     // 그릴 선의 좌표 배열
          strokeWeight: 5,    // 선 두께
          strokeColor: '#FF0000', // 선 색상 (빨강)
          strokeOpacity: 0.7, // 선 불투명도
          strokeStyle: 'solid', // 선 스타일
        });
        polyline.setMap(mapInstance.current); // 지도에 폴리라인 표시
        mapInstance.current.polyline = polyline; // 폴리라인 참조 저장

        // 경로의 모든 좌표를 포함하는 지도의 경계 설정
        const bounds = new window.kakao.maps.LatLngBounds();
        linePath.forEach(latlng => bounds.extend(latlng));
        mapInstance.current.setBounds(bounds);
      } else {
        // 경로 데이터가 없을 경우 출발지와 도착지만 포함하는 지도의 경계 설정
        const bounds = new window.kakao.maps.LatLngBounds();
        bounds.extend(startLatLng);
        bounds.extend(endLatLng);
        mapInstance.current.setBounds(bounds);
      }
    } else {
      // 출발지 또는 도착지 좌표가 없을 경우 지도를 기본 중심으로 재설정
      const defaultCenter = getDefaultCenter();
      if (defaultCenter) {
        mapInstance.current.setCenter(defaultCenter);
        mapInstance.current.setLevel(3); // 기본 줌 레벨로 설정
      }
    }
  }, [startCoords, endCoords, routePaths]); // 의존성 배열: 이 값들이 변경될 때마다 useEffect 재실행

  // 지도를 표시할 DOM 엘리먼트
  return <MapContainer ref={mapRef} />;
};

export default MapDisplay;
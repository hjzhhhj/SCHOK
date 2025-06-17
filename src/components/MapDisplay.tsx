import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

declare global {
  interface Window {
    kakao: any;
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
  routePaths: { x: number; y: number }[];
  onMapLoaded: () => void;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ startCoords, endCoords, routePaths, onMapLoaded }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const scriptLoaded = useRef(false);
  const mapInitialized = useRef(false);

  const getDefaultCenter = () => {
    if (window.kakao && window.kakao.maps) {
      return new window.kakao.maps.LatLng(38.207128, 128.591905);
    }
    return null;
  };

  const initializeMap = useCallback(() => {
    if (mapInitialized.current || !mapRef.current || !window.kakao || !window.kakao.maps) return;

    const defaultCenter = getDefaultCenter();
    if (!defaultCenter) return;

    mapInstance.current = new window.kakao.maps.Map(mapRef.current, { center: defaultCenter, level: 3 });
    mapInitialized.current = true;
    onMapLoaded();
  }, [onMapLoaded]);

  useEffect(() => {
    if (scriptLoaded.current) {
      if (window.kakao && !mapInitialized.current) {
        initializeMap();
      }
      return;
    }

    if (document.getElementById('kakao-map-sdk')) {
      scriptLoaded.current = true;
      if (window.kakao && !mapInitialized.current) initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-map-sdk';
    const KAKAO_JAVASCRIPT_KEY = import.meta.env.VITE_APP_KAKAO_JAVASCRIPT_KEY;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JAVASCRIPT_KEY}&libraries=services,clusterer,drawing&autoload=false`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded.current = true;
      window.kakao.maps.load(initializeMap);
    };

    script.onerror = () => {
      console.error('❌ 카카오맵 스크립트 로드 실패. 인터넷 연결 또는 앱 키 확인!');
      scriptLoaded.current = false;
    };

    document.head.appendChild(script);
  }, [initializeMap]);

  useEffect(() => {
    if (!mapInitialized.current || !mapInstance.current) return;

    // 기존 마커와 폴리라인 제거
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

      if (!mapInstance.current.markers) mapInstance.current.markers = [];
      mapInstance.current.markers.push(startMarker, endMarker);

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
        const bounds = new window.kakao.maps.LatLngBounds();
        bounds.extend(startLatLng);
        bounds.extend(endLatLng);
        mapInstance.current.setBounds(bounds);
      }
    } else {
      const defaultCenter = getDefaultCenter();
      if (defaultCenter) {
        mapInstance.current.setCenter(defaultCenter);
        mapInstance.current.setLevel(3);
      }
    }
  }, [startCoords, endCoords, routePaths]);

  return <MapContainer ref={mapRef} />;
};

export default MapDisplay;

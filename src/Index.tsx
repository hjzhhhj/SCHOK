import SetupPage from './pages/SetUpPage';
import Timetable from './pages/TimeTable';
import Meal from './pages/Meal';
import Home from './pages/Home';
import React from 'react';
import styled from 'styled-components';
import BG from './assets/background.png'

const IndexLayoutContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;

    background-image: url(${BG});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;

    min-height: 100vh;
    width: 100vw;
    overflow-x: hidden;
    position: relative;
    z-index: 1;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.5);
        z-index: -1;
    }
`;

const TopSection = styled.div`
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    padding: 25px 50px 0px 50px;
`;

const BottomSection = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-start; 
    padding: 0 50px 20px 50px;
`;

// --- Index 컴포넌트 ---
const Index: React.FC = () => {
    return (
        <IndexLayoutContainer>
            {/* 상단 섹션: 시간표, 급식, 길찾기 컴포넌트 배치 */}
            <TopSection>
                <Timetable />
                <Meal />
                <Home />
            </TopSection>

            {/* 하단 섹션: 사용자 설정 컴포넌트 배치 */}
            <BottomSection>
                <SetupPage /> 
            </BottomSection>
        </IndexLayoutContainer>
    );
};

export default Index;
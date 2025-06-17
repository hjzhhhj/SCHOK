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
    justify-content: center;
    margin-bottom: 4px;
`;

const BottomSection = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    width: 100%;
    height: 600px
`;

const Index: React.FC = () => {
    return (
        <IndexLayoutContainer>
            <TopSection>
                <SetupPage />
            </TopSection>
            <BottomSection>
                <Timetable />
                <Meal />
                <Home /> 
            </BottomSection>
        </IndexLayoutContainer>
    );
}

export default Index;
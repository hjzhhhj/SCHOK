import SetupPage from './pages/SetUpPage';
import Timetable from './pages/TimeTable';
import Meal from './pages/Meal';
import React from 'react';
import styled from 'styled-components'; 

const IndexLayoutContainer = styled.div`
    display: flex; 
    flex-wrap: wrap; 
    justify-content: center;
    align-items: flex-start; 
`;

const Index: React.FC = () => {
    return (
        <IndexLayoutContainer>
            <SetupPage />
            <Timetable />
            <Meal />
        </IndexLayoutContainer>
    );
}

export default Index;
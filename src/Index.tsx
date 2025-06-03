import SetupPage from './pages/SetUpPage'
import Timetable from './pages/TimeTable'
import Meal from './pages/Meal'
import React from 'react'; 

const Index: React.FC = () => {
    return (
        <div>
            <Timetable />
            <Meal />
        </div>
    );
}

export default Index;
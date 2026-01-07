import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ProblemContainer from './components/ProblemContainer';
import ConditionManager from './components/ConditionManager';
import MultiplicationContainer from './components/MultiplicationContainer';
import { createInitialProblemState } from './constants/initialState';
import './index.css';

function App() {
  const [problems, setProblems] = useState(() =>
    Array(10).fill(null).map(createInitialProblemState)
  );
  const [currentTab, setCurrentTab] = useState(0); // 0-9 or 'manager'

  // Callback to update state for a specific problem index
  const handleUpdate = useCallback((index, newState) => {
    setProblems(prev => {
      const next = [...prev];
      next[index] = newState;
      return next;
    });
  }, []);

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      <div className={`content-area ${currentTab === 'manager' ? 'manager-mode' : ''}`}>
        {currentTab === 'multiplication' ? (
          <MultiplicationContainer />
        ) : currentTab === 'manager' ? (
          <ConditionManager problems={problems} onUpdate={handleUpdate} />
        ) : (
          // Key ensures component remounts when tab changes, resetting internal hook state to initialData
          <ProblemContainer
            key={currentTab}
            initialData={problems[currentTab]}
            onUpdate={(newState) => handleUpdate(currentTab, newState)}
          />
        )}
      </div>
    </div>
  );
}

export default App;

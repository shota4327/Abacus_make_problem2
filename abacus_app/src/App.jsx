import React from 'react';
import ProblemGrid from './components/ProblemGrid';
import DigitManager from './components/DigitManager';
import FrequencyCounter from './components/FrequencyCounter';
import ConsecutiveCounter from './components/ConsecutiveCounter';
import ConditionPanel from './components/ConditionPanel';
import { useProblemState } from './hooks/useProblemState';
import './index.css';

function App() {
  const { grid, updateDigit, totalSum, frequency, consecutive, generateRandomGrid } = useProblemState();

  return (
    <div className="app-container">
      <ProblemGrid grid={grid} updateDigit={updateDigit} totalSum={totalSum} />
      <DigitManager generateRandomGrid={generateRandomGrid} />
      <FrequencyCounter frequency={frequency} />
      <ConsecutiveCounter consecutive={consecutive} />
      <ConditionPanel />
    </div>
  );
}

export default App;

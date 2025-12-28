import React from 'react';
import ProblemGrid from './components/ProblemGrid';
import DigitManager from './components/DigitManager';
import FrequencyCounter from './components/FrequencyCounter';
import ConsecutiveCounter from './components/ConsecutiveCounter';
import ConditionPanel from './components/ConditionPanel';
import { useProblemState } from './hooks/useProblemState';
import './index.css';

function App() {
  const {
    grid,
    minDigit,
    maxDigit,
    targetTotalDigits,
    rowCount,
    setMinDigit,
    setMaxDigit,
    setTargetTotalDigits,
    setRowCount,
    updateDigit,
    updateRowDigitCount,
    generateRandomGrid,
    totalSum,
    frequency,
    totalFrequency,
    frequencyDiffs,
    consecutive,
    rowDigitCounts,
    totalRowDigits,
    plusOneDigit, setPlusOneDigit,
    minusOneDigit, setMinusOneDigit,
    enclosedDigit, setEnclosedDigit,
    sandwichedDigit, setSandwichedDigit,
    consecutiveDigit, setConsecutiveDigit
  } = useProblemState();

  return (
    <div className="app-container">
      <ProblemGrid
        grid={grid}
        updateDigit={updateDigit}
        totalSum={totalSum}
        generateRandomGrid={generateRandomGrid}
      />
      <DigitManager
        rowDigitCounts={rowDigitCounts}
        totalRowDigits={totalRowDigits}
        updateRowDigitCount={updateRowDigitCount}
      />
      <FrequencyCounter
        frequency={frequency}
        totalFrequency={totalFrequency}
        frequencyDiffs={frequencyDiffs}
      />
      <ConsecutiveCounter consecutive={consecutive} />
      <ConditionPanel
        minDigit={minDigit}
        maxDigit={maxDigit}
        setMinDigit={setMinDigit}
        setMaxDigit={setMaxDigit}
        targetTotalDigits={targetTotalDigits}
        setTargetTotalDigits={setTargetTotalDigits}
        rowCount={rowCount}
        setRowCount={setRowCount}
        plusOneDigit={plusOneDigit}
        setPlusOneDigit={setPlusOneDigit}
        minusOneDigit={minusOneDigit}
        setMinusOneDigit={setMinusOneDigit}
        enclosedDigit={enclosedDigit}
        setEnclosedDigit={setEnclosedDigit}
        sandwichedDigit={sandwichedDigit}
        setSandwichedDigit={setSandwichedDigit}
        consecutiveDigit={consecutiveDigit}
        setConsecutiveDigit={setConsecutiveDigit}
      />
    </div>
  );
}

export default App;

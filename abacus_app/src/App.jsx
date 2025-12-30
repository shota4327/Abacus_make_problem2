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
    isGenerating,
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
    consecutiveDigit, setConsecutiveDigit,
    isMinusRows, toggleRowMinus,
    firstRowMin, setFirstRowMin,
    firstRowMax, setFirstRowMax,
    lastRowMin, setLastRowMin,
    lastRowMax, setLastRowMax,
    answerMin, setAnswerMin,
    answerMax, setAnswerMax,
    complementStatus
  } = useProblemState();

  const hasMinus = isMinusRows.some(Boolean);

  return (
    <div className="app-container">
      {isGenerating && (
        <div className="loading-overlay">
          <div className="loading-message">生成中...</div>
        </div>
      )}
      <ProblemGrid
        grid={grid}
        updateDigit={updateDigit}
        isMinusRows={isMinusRows}
        toggleRowMinus={toggleRowMinus}
        totalSum={totalSum}
        generateRandomGrid={generateRandomGrid}
      />
      <DigitManager
        rowDigitCounts={rowDigitCounts}
        totalRowDigits={totalRowDigits}
        updateRowDigitCount={updateRowDigitCount}
        minDigit={minDigit}
        maxDigit={maxDigit}
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
        firstRowMin={firstRowMin}
        setFirstRowMin={setFirstRowMin}
        firstRowMax={firstRowMax}
        setFirstRowMax={setFirstRowMax}
        lastRowMin={lastRowMin}
        setLastRowMin={setLastRowMin}
        lastRowMax={lastRowMax}
        setLastRowMax={setLastRowMax}
        answerMin={answerMin}
        setAnswerMin={setAnswerMin}
        answerMax={answerMax}
        setAnswerMax={setAnswerMax}
        hasMinus={hasMinus}
        complementStatus={complementStatus}
      />
    </div>
  );
}

export default App;

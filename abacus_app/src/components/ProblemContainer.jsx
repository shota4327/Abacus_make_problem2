import React, { useEffect, useRef } from 'react';
import ProblemGrid from './ProblemGrid';
import FrequencyCounter from './FrequencyCounter';
import ConsecutiveCounter from './ConsecutiveCounter';
import ConditionPanel from './ConditionPanel';
import { useProblemState } from '../hooks/useProblemState';

const ProblemContainer = ({ initialData, onUpdate }) => {
    // Initialize useProblemState with the passed data for this specific problem
    const {
        grid, updateDigit, rowCount,
        minDigit, setMinDigit,
        maxDigit, setMaxDigit,
        targetTotalDigits, setTargetTotalDigits,
        setRowCount,
        isMinusAllowed, setIsMinusAllowed,
        frequency, totalFrequency, frequencyDiffs,
        rowDigitCounts, totalRowDigits, updateRowDigitCount,
        generateRandomGrid,
        isGenerating,
        plusOneDigit, setPlusOneDigit,
        minusOneDigit, setMinusOneDigit,
        enclosedDigit, setEnclosedDigit,
        sandwichedDigit, setSandwichedDigit,
        consecutiveDigit, setConsecutiveDigit,
        firstRowMin, setFirstRowMin,
        firstRowMax, setFirstRowMax,
        lastRowMin, setLastRowMin,
        lastRowMax, setLastRowMax,
        answerMin, setAnswerMin,
        answerMax, setAnswerMax,
        complementStatus,
        isEnclosedUsed, isSandwichedUsed, isConsecutiveUsed,
        isFirstMinValid, isFirstMaxValid, isLastMinValid, isLastMaxValid, isAnsMinValid, isAnsMaxValid,
        totalSum,
        consecutive, // Added
        isMinusRows, toggleRowMinus, // Added
        currentState // New snapshot object
    } = useProblemState(initialData);

    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    });

    // Sync state back to parent whenever it changes
    useEffect(() => {
        if (onUpdateRef.current && currentState) {
            onUpdateRef.current(currentState);
        }
    }, [currentState]);

    return (
        <>
            <ProblemGrid
                grid={grid}
                updateDigit={updateDigit}
                rowCount={rowCount}
                isMinusRows={isMinusRows}
                toggleRowMinus={toggleRowMinus}
                totalSum={totalSum}
                generateRandomGrid={generateRandomGrid}
                isMinusAllowed={isMinusAllowed}
                setIsMinusAllowed={setIsMinusAllowed}
            />

            <FrequencyCounter
                frequency={frequency}
                totalFrequency={totalFrequency}
                frequencyDiffs={frequencyDiffs}
                rowDigitCounts={rowDigitCounts}
                totalRowDigits={totalRowDigits}
                targetTotalDigits={targetTotalDigits}
                updateRowDigitCount={updateRowDigitCount}
                minDigit={minDigit}
                maxDigit={maxDigit}
            />

            <ConsecutiveCounter consecutive={consecutive} />

            <ConditionPanel
                minDigit={minDigit} setMinDigit={setMinDigit}
                maxDigit={maxDigit} setMaxDigit={setMaxDigit}
                targetTotalDigits={targetTotalDigits} setTargetTotalDigits={setTargetTotalDigits}
                rowCount={rowCount} setRowCount={setRowCount}
                generateRandomGrid={generateRandomGrid}
                isMinusAllowed={isMinusAllowed} setIsMinusAllowed={setIsMinusAllowed}
                plusOneDigit={plusOneDigit} setPlusOneDigit={setPlusOneDigit}
                minusOneDigit={minusOneDigit} setMinusOneDigit={setMinusOneDigit}
                enclosedDigit={enclosedDigit} setEnclosedDigit={setEnclosedDigit}
                sandwichedDigit={sandwichedDigit} setSandwichedDigit={setSandwichedDigit}
                consecutiveDigit={consecutiveDigit} setConsecutiveDigit={setConsecutiveDigit}
                firstRowMin={firstRowMin} setFirstRowMin={setFirstRowMin}
                firstRowMax={firstRowMax} setFirstRowMax={setFirstRowMax}
                lastRowMin={lastRowMin} setLastRowMin={setLastRowMin}
                lastRowMax={lastRowMax} setLastRowMax={setLastRowMax}
                answerMin={answerMin} setAnswerMin={setAnswerMin}
                answerMax={answerMax} setAnswerMax={setAnswerMax}
                hasMinus={isMinusRows.some(Boolean)}
                complementStatus={complementStatus}
                isEnclosedUsed={isEnclosedUsed}
                isSandwichedUsed={isSandwichedUsed}
                isConsecutiveUsed={isConsecutiveUsed}
                isFirstMinValid={isFirstMinValid}
                isFirstMaxValid={isFirstMaxValid}
                isLastMinValid={isLastMinValid}
                isLastMaxValid={isLastMaxValid}
                isAnsMinValid={isAnsMinValid}
                isAnsMaxValid={isAnsMaxValid}
            />

            {isGenerating && (
                <div className="loading-overlay">
                    <div className="loading-message">作成中...</div>
                </div>
            )}
        </>
    );
};

export default ProblemContainer;

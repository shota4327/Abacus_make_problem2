import React from 'react';
import MultiplicationGrid from './MultiplicationGrid';
import FrequencyCounter from './FrequencyCounter';
import ConsecutiveCounter from './ConsecutiveCounter';
import { useMultiplicationState } from '../hooks/useMultiplicationState';
import './Multiplication.css';

const MultiplicationContainer = () => {
    const {
        problems,
        updateDigit,
        toggleDecimal,
        regenerateRow,

        frequencyAll,
        totalFrequencyAll,
        rowDigitCountsAll,
        totalRowDigitsAll,
        frequencyDiffsAll,
        targetTotalDigitsAll,

        frequencyLeft,
        totalFrequencyLeft,
        rowDigitCountsLeft,
        totalRowDigitsLeft,

        frequencyRight,
        totalFrequencyRight,
        rowDigitCountsRight,
        totalRowDigitsRight,

        consecutive,
        generateRandomProblems,
        replaceProblems
    } = useMultiplicationState();

    // Handlers for updating row digit counts (regeneration)
    const handleUpdateLeft = (rowIndex, length) => {
        regenerateRow(rowIndex, 'left', length);
    };

    const handleUpdateRight = (rowIndex, length) => {
        regenerateRow(rowIndex, 'right', length);
    };

    // No-op for "All" counter if needed, or null
    const noop = () => { };

    return (
        <div className="multiplication-container">
            <div className="multiplication-full-layout">
                {/* Area 1: Problem Grid */}
                <div className="layout-column area-grid">
                    <MultiplicationGrid
                        problems={problems}
                        updateDigit={updateDigit}
                        toggleDecimal={toggleDecimal}
                        generateRandomProblems={generateRandomProblems}
                        replaceProblems={replaceProblems}
                    />
                </div>

                {/* Column 2: Frequency All + Consecutive */}
                <div className="layout-column area-mixed-stats">
                    <div className="sub-stats-group">
                        <FrequencyCounter
                            title="出現回数 (全体)"
                            frequency={frequencyAll}
                            totalFrequency={totalFrequencyAll}
                            rowDigitCounts={rowDigitCountsAll}
                            totalRowDigits={totalRowDigitsAll}
                            updateRowDigitCount={noop}
                            frequencyDiffs={frequencyDiffsAll}
                            targetTotalDigits={targetTotalDigitsAll}
                            readOnlyDigitCount={true}
                        />
                    </div>
                    <div className="sub-stats-group">
                        <ConsecutiveCounter consecutive={consecutive} />
                    </div>
                </div>

                {/* Column 3: Frequency Left/Right */}
                <div className="layout-column area-stats-lr">
                    <div className="sub-stats-group">
                        <FrequencyCounter
                            title="出現回数 (左)"
                            frequency={frequencyLeft}
                            totalFrequency={totalFrequencyLeft}
                            rowDigitCounts={rowDigitCountsLeft}
                            totalRowDigits={totalRowDigitsLeft}
                            updateRowDigitCount={handleUpdateLeft}
                            frequencyDiffs={[]}
                            warnThreshold={2}
                            minDigit={4}
                            maxDigit={7}
                        />
                    </div>
                    <div className="sub-stats-group">
                        <FrequencyCounter
                            title="出現回数 (右)"
                            frequency={frequencyRight}
                            totalFrequency={totalFrequencyRight}
                            rowDigitCounts={rowDigitCountsRight}
                            totalRowDigits={totalRowDigitsRight}
                            updateRowDigitCount={handleUpdateRight}
                            frequencyDiffs={[]}
                            warnThreshold={2}
                            minDigit={4}
                            maxDigit={7}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiplicationContainer;

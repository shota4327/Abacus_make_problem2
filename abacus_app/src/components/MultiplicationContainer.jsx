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

        consecutive
    } = useMultiplicationState();

    // FrequencyCounter expects specific props. 
    // We are reusing it, but it has some Mitorizan-specific logic (like minDigit/maxDigit for random selector).
    // For now we will pass dummy update handlers or simplified ones if we want to support random digit count generation later.
    // The current FrequencyCounter has a "digit-length-btn" that calls updateRowDigitCount.
    // For Multiplication, if we want to control number of digits (4-7), we might strictly need that.
    // However, the current req is just to "display" the counts.
    // "出現回数と数字の数(桁数)を表示します" -> Display counts and number of digits.

    // We'll pass empty functions for updateRowDigitCount to prevent errors if clicked, or implement a dummy.

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
                            updateRowDigitCount={noop}
                            frequencyDiffs={[]}
                            warnThreshold={2}
                        />
                    </div>
                    <div className="sub-stats-group">
                        <FrequencyCounter
                            title="出現回数 (右)"
                            frequency={frequencyRight}
                            totalFrequency={totalFrequencyRight}
                            rowDigitCounts={rowDigitCountsRight}
                            totalRowDigits={totalRowDigitsRight}
                            updateRowDigitCount={noop}
                            frequencyDiffs={[]}
                            warnThreshold={2}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiplicationContainer;

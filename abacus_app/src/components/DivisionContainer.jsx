import React from 'react';
import DivisionGrid from './DivisionGrid';
import FrequencyCounter from './FrequencyCounter';
import DivisionFrequencyCounter from './DivisionFrequencyCounter';
import ConsecutiveCounter from './ConsecutiveCounter';
import { useDivisionState } from '../hooks/useDivisionState';
import './Multiplication.css'; // 同じスタイルを流用するためインポート

const DivisionContainer = () => {
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

        frequencyDivisor,
        totalFrequencyDivisor,
        rowDigitCountsDivisor,
        totalRowDigitsDivisor,

        frequencyAnswer,
        totalFrequencyAnswer,
        rowDigitCountsAnswer,
        totalRowDigitsAnswer,

        consecutive,
        generateRandomProblems,
        replaceProblems,
        isGenerating
    } = useDivisionState();

    // Handlers for updating row digit counts (regeneration)
    const handleUpdateDivisor = (rowIndex, length) => {
        regenerateRow(rowIndex, 'divisor', length);
    };

    const handleUpdateAnswer = (rowIndex, length) => {
        regenerateRow(rowIndex, 'answer', length);
    };

    // No-op for "All" counter if needed, or null
    const noop = () => { };

    return (
        <div className="multiplication-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
            {/* 上部: 問題作成エリア */}
            <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
                <DivisionGrid
                    problems={problems}
                    updateDigit={updateDigit}
                    toggleDecimal={toggleDecimal}
                    generateRandomProblems={generateRandomProblems}
                    replaceProblems={replaceProblems}
                />
            </div>

            {/* 下部: 統計エリア */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'flex-start', margin: '0 auto', overflowX: 'auto', paddingBottom: '10px' }}>
                <div className="sub-stats-group" style={{ flex: '0 0 auto', minWidth: '200px' }}>
                    <ConsecutiveCounter consecutive={consecutive} />
                </div>
                
                {/* 3つの出現回数を統合したエリア */}
                <div className="panel" style={{ display: 'flex', flexDirection: 'row', flex: '0 0 auto', padding: '10px' }}>
                    <div style={{ flex: '0 0 auto', borderRight: '2px solid var(--text-color, #333)', paddingRight: '15px', marginRight: '15px' }}>
                        <DivisionFrequencyCounter
                            title="出現回数 (全体)"
                            frequency={frequencyAll}
                            totalFrequency={totalFrequencyAll}
                            rowDigitCounts={rowDigitCountsAll}
                            totalRowDigits={totalRowDigitsAll}
                            updateRowDigitCount={noop}
                            frequencyDiffs={frequencyDiffsAll}
                            targetTotalDigits={targetTotalDigitsAll}
                            readOnlyDigitCount={true}
                            noPanel={true}
                        />
                    </div>
                    
                    <div style={{ flex: '0 0 auto', borderRight: '2px solid var(--text-color, #333)', paddingRight: '15px', marginRight: '15px' }}>
                        <DivisionFrequencyCounter
                            title="出現回数 (割る数)"
                            frequency={frequencyDivisor}
                            totalFrequency={totalFrequencyDivisor}
                            rowDigitCounts={rowDigitCountsDivisor}
                            totalRowDigits={totalRowDigitsDivisor}
                            updateRowDigitCount={handleUpdateDivisor}
                            frequencyDiffs={[]}
                            warnThreshold={2}
                            minDigit={4}
                            maxDigit={7}
                            noPanel={true}
                            hideNoColumn={true}
                        />
                    </div>
                    
                    <div style={{ flex: '0 0 auto' }}>
                        <DivisionFrequencyCounter
                            title="出現回数 (答え)"
                            frequency={frequencyAnswer}
                            totalFrequency={totalFrequencyAnswer}
                            rowDigitCounts={rowDigitCountsAnswer}
                            totalRowDigits={totalRowDigitsAnswer}
                            updateRowDigitCount={handleUpdateAnswer}
                            frequencyDiffs={[]}
                            warnThreshold={2}
                            minDigit={4}
                            maxDigit={7}
                            noPanel={true}
                            hideNoColumn={true}
                        />
                    </div>
                </div>
            </div>

            {isGenerating && (
                <div className="loading-overlay">
                    <div className="loading-message">作成中...</div>
                </div>
            )}
        </div>
    );
};

export default DivisionContainer;

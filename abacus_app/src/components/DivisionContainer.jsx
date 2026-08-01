/**
 * @file DivisionContainer.jsx
 * @description 割り算問題（10問分）のグリッド編集画面および下部の統計情報（全体・割る数・商の出現頻度、連続桁）を統括表示するコンテナコンポーネントです。
 */

import React from 'react';
import DivisionGrid from './DivisionGrid';
import FrequencyCounter from './FrequencyCounter';
import DivisionFrequencyCounter from './DivisionFrequencyCounter';
import ConsecutiveCounter from './ConsecutiveCounter';
import { useDivisionState } from '../hooks/useDivisionState';
import './Multiplication.css';

/** 全体出現頻度表の読み取り専用ハンドラー（noop） */
const noop = () => { };

/**
 * 割り算問題作成画面コンテナコンポーネント
 * 
 * @returns {JSX.Element} 割り算全体UI画面
 */
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

    /** 割る数（divisor）の桁数変更・再生成ハンドラー */
    const handleUpdateDivisor = (rowIndex, length) => {
        regenerateRow(rowIndex, 'divisor', length);
    };

    /** 商（answer）の桁数変更・再生成ハンドラー */
    const handleUpdateAnswer = (rowIndex, length) => {
        regenerateRow(rowIndex, 'answer', length);
    };

    return (
        <div className="multiplication-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
            {/* 上部: 割り算問題盤面編集エリア */}
            <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
                <DivisionGrid
                    problems={problems}
                    updateDigit={updateDigit}
                    toggleDecimal={toggleDecimal}
                    generateRandomProblems={generateRandomProblems}
                    replaceProblems={replaceProblems}
                />
            </div>

            {/* 下部: 統計情報パネル群（連続桁マトリクス＋各部出現頻度） */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'flex-start', margin: '0 auto', overflowX: 'auto', paddingBottom: '10px' }}>
                <div className="sub-stats-group" style={{ flex: '0 0 auto', minWidth: '200px' }}>
                    <ConsecutiveCounter consecutive={consecutive} />
                </div>
                
                {/* 3つの出現回数（全体・割る数・答え）を統合した統計パネル */}
                <div className="panel" style={{ display: 'flex', flexDirection: 'row', flex: '0 0 auto', padding: '10px' }}>
                    {/* 全体統計 */}
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
                    
                    {/* 割る数（除数）統計 */}
                    <div style={{ flex: '0 0 auto', borderRight: '2px solid var(--text-color, #333)', paddingRight: '15px', marginRight: '15px' }}>
                        <DivisionFrequencyCounter
                            title="出現回数 (割る数)"
                            frequency={frequencyDivisor}
                            totalFrequency={totalFrequencyDivisor}
                            rowDigitCounts={rowDigitCountsDivisor}
                            totalRowDigits={totalRowDigitsDivisor}
                            updateRowDigitCount={handleUpdateDivisor}
                            frequencyDiffs={[]}
                            minDigit={4}
                            maxDigit={7}
                            noPanel={true}
                            hideNoColumn={true}
                        />
                    </div>
                    
                    {/* 商（答え）統計 */}
                    <div style={{ flex: '0 0 auto' }}>
                        <DivisionFrequencyCounter
                            title="出現回数 (答え)"
                            frequency={frequencyAnswer}
                            totalFrequency={totalFrequencyAnswer}
                            rowDigitCounts={rowDigitCountsAnswer}
                            totalRowDigits={totalRowDigitsAnswer}
                            updateRowDigitCount={handleUpdateAnswer}
                            frequencyDiffs={[]}
                            minDigit={4}
                            maxDigit={7}
                            noPanel={true}
                            hideNoColumn={true}
                        />
                    </div>
                </div>
            </div>

            {/* 非同期生成中のオーバーレイ表示 */}
            {isGenerating && (
                <div className="loading-overlay">
                    <div className="loading-message">作成中...</div>
                </div>
            )}
        </div>
    );
};

export default DivisionContainer;


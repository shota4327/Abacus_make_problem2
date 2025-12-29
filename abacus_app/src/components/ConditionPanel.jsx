import React, { useState } from 'react';
import './ConditionPanel.css';

const ConditionPanel = ({
    minDigit, maxDigit, setMinDigit, setMaxDigit,
    targetTotalDigits, setTargetTotalDigits,
    rowCount, setRowCount,
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
    hasMinus,
    complementStatus
}) => {
    const [activeSelector, setActiveSelector] = useState(null);
    const lengths = [5, 6, 7, 8, 9, 10, 11, 12];
    const totalOptions = [120, 130, 140];
    const rowOptions = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const digitOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const handleSelect = (val) => {
        if (activeSelector === 'min') setMinDigit(Math.min(val, maxDigit));
        else if (activeSelector === 'max') setMaxDigit(Math.max(val, minDigit));
        else if (activeSelector === 'total') setTargetTotalDigits(val);
        else if (activeSelector === 'rows') setRowCount(val);
        else if (activeSelector === 'plusOne') setPlusOneDigit(val);
        else if (activeSelector === 'minusOne') setMinusOneDigit(val);
        else if (activeSelector === 'enclosed') setEnclosedDigit(val);
        else if (activeSelector === 'sandwiched') setSandwichedDigit(val);
        else if (activeSelector === 'consecutive') setConsecutiveDigit(val);
        else if (activeSelector === 'firstMin') setFirstRowMin(val);
        else if (activeSelector === 'firstMax') setFirstRowMax(val);
        else if (activeSelector === 'lastMin') setLastRowMin(val);
        else if (activeSelector === 'lastMax') setLastRowMax(val);
        else if (activeSelector === 'ansMin') setAnswerMin(val);
        else if (activeSelector === 'ansMax') setAnswerMax(val);
        setActiveSelector(null);
    };

    const renderDigitSelector = (type, currentVal) => {
        // Types that allow "null" (displayed as "-")
        const isNullable = ['firstMin', 'firstMax', 'lastMin', 'lastMax', 'ansMin', 'ansMax'].includes(type);

        return (
            <div className="picker-wrapper">
                <button
                    className={`picker-btn ${activeSelector === type ? 'active' : ''}`}
                    onClick={() => setActiveSelector(activeSelector === type ? null : type)}
                >
                    {currentVal === null ? '-' : currentVal}
                </button>
                {activeSelector === type && (
                    <div className="picker-popover">
                        {isNullable && (
                            <button onClick={() => handleSelect(null)}>-</button>
                        )}
                        {digitOptions.map((d, i) => (
                            <button key={i} onClick={() => handleSelect(d)}>
                                {d}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderRangeDigitSelector = (minType, minVal, maxType, maxVal) => (
        <div className="range-picker">
            {renderDigitSelector(minType, minVal)}
            <span className="separator">ー</span>
            {renderDigitSelector(maxType, maxVal)}
        </div>
    );

    return (
        <div className="panel condition-panel">
            <h2>作問条件</h2>
            <div className="condition-list">
                <div className="condition-item">
                    <span className="label">総字数:</span>
                    <div className="picker-wrapper">
                        <button
                            className={`picker-btn wide ${activeSelector === 'total' ? 'active' : ''}`}
                            onClick={() => setActiveSelector(activeSelector === 'total' ? null : 'total')}
                        >
                            {targetTotalDigits}
                        </button>
                        {activeSelector === 'total' && (
                            <div className="picker-popover single-col">
                                {totalOptions.map(t => (
                                    <button key={t} onClick={() => handleSelect(t)}>{t}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="condition-item">
                    <span className="label">口数:</span>
                    <div className="picker-wrapper">
                        <button
                            className={`picker-btn ${activeSelector === 'rows' ? 'active' : ''}`}
                            onClick={() => setActiveSelector(activeSelector === 'rows' ? null : 'rows')}
                        >
                            {rowCount}
                        </button>
                        {activeSelector === 'rows' && (
                            <div className="picker-popover">
                                {rowOptions.map(r => (
                                    <button key={r} onClick={() => handleSelect(r)}>{r}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="condition-item">
                    <span className="label">ケタ範囲:</span>
                    <div className="range-picker">
                        <div className="picker-wrapper">
                            <button
                                className={`picker-btn ${activeSelector === 'min' ? 'active' : ''}`}
                                onClick={() => setActiveSelector(activeSelector === 'min' ? null : 'min')}
                            >
                                {minDigit}
                            </button>
                            {activeSelector === 'min' && (
                                <div className="picker-popover">
                                    {lengths.map(l => (
                                        <button key={l} onClick={() => handleSelect(l)}>{l}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="separator">ー</span>
                        <div className="picker-wrapper">
                            <button
                                className={`picker-btn ${activeSelector === 'max' ? 'active' : ''}`}
                                onClick={() => setActiveSelector(activeSelector === 'max' ? null : 'max')}
                            >
                                {maxDigit}
                            </button>
                            {activeSelector === 'max' && (
                                <div className="picker-popover">
                                    {lengths.map(l => (
                                        <button key={l} onClick={() => handleSelect(l)}>{l}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="condition-item">
                    <span className="label">＋１文字:</span>
                    {renderDigitSelector('plusOne', plusOneDigit)}
                </div>
                <div className="condition-item">
                    <span className="label">－１文字:</span>
                    {renderDigitSelector('minusOne', minusOneDigit)}
                </div>
                <div className="condition-item">
                    <span className="label">囲み文字:</span>
                    {renderDigitSelector('enclosed', enclosedDigit)}
                </div>
                <div className="condition-item">
                    <span className="label">はさまれ文字:</span>
                    {renderDigitSelector('sandwiched', sandwichedDigit)}
                </div>
                <div className="condition-item">
                    <span className="label">連続文字:</span>
                    {renderDigitSelector('consecutive', consecutiveDigit)}
                </div>


                <div className="condition-item">
                    <span className="label">１口目:</span>
                    {renderRangeDigitSelector('firstMin', firstRowMin, 'firstMax', firstRowMax)}
                </div>
                <div className="condition-item">
                    <span className="label">最終口:</span>
                    {renderRangeDigitSelector('lastMin', lastRowMin, 'lastMax', lastRowMax)}
                </div>
                <div className="condition-item">
                    <span className="label">答え:</span>
                    {renderRangeDigitSelector('ansMin', answerMin, 'ansMax', answerMax)}
                </div>
                <div className="condition-item">
                    <span className="label">マイナス:</span>
                    <span style={{ fontWeight: 'bold' }}>
                        {hasMinus ? 'あり' : 'なし'}
                    </span>
                </div>
                <div className="condition-item">
                    <span className="label">補数計算:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {complementStatus}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ConditionPanel;

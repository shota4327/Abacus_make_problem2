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
    complementStatus,
    isEnclosedUsed
}) => {
    const [activeSelector, setActiveSelector] = useState(null);
    const lengths = [5, 6, 7, 8, 9, 10, 11, 12];
    const totalOptions = [120, 130, 140];
    const rowOptions = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const digitOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const handleSelect = (val) => {
        let finalVal = val;
        if (val === 'R') {
            const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
            if (activeSelector === 'min' || activeSelector === 'max') finalVal = getRandom(lengths);
            else if (activeSelector === 'total') finalVal = getRandom(totalOptions);
            else if (activeSelector === 'rows') finalVal = getRandom(rowOptions);
            else finalVal = getRandom(digitOptions);
        }

        if (activeSelector === 'min') setMinDigit(Math.min(finalVal, maxDigit));
        else if (activeSelector === 'max') setMaxDigit(Math.max(finalVal, minDigit));
        else if (activeSelector === 'total') setTargetTotalDigits(finalVal);
        else if (activeSelector === 'rows') setRowCount(finalVal);
        else if (activeSelector === 'plusOne') setPlusOneDigit(finalVal);
        else if (activeSelector === 'minusOne') setMinusOneDigit(finalVal);
        else if (activeSelector === 'enclosed') setEnclosedDigit(finalVal);
        else if (activeSelector === 'sandwiched') setSandwichedDigit(finalVal);
        else if (activeSelector === 'consecutive') setConsecutiveDigit(finalVal);
        else if (activeSelector === 'firstMin') setFirstRowMin(finalVal);
        else if (activeSelector === 'firstMax') setFirstRowMax(finalVal);
        else if (activeSelector === 'lastMin') setLastRowMin(finalVal);
        else if (activeSelector === 'lastMax') setLastRowMax(finalVal);
        else if (activeSelector === 'ansMin') setAnswerMin(finalVal);
        else if (activeSelector === 'ansMax') setAnswerMax(finalVal);
        setActiveSelector(null);
    };

    const renderDigitSelector = (type, currentVal) => {
        // Types that allow "null" (displayed as "-")
        const isNullable = ['firstMin', 'firstMax', 'lastMin', 'lastMax', 'ansMin', 'ansMax', 'enclosed', 'sandwiched', 'consecutive', 'plusOne', 'minusOne'].includes(type);

        const isWarn = type === 'enclosed' && !isEnclosedUsed;
        return (
            <div className="picker-wrapper">
                <button
                    className={`picker-btn ${activeSelector === type ? 'active' : ''} ${isWarn ? 'warn' : ''}`}
                    onClick={() => setActiveSelector(activeSelector === type ? null : type)}
                >
                    {currentVal === null ? '-' : currentVal}
                </button>
                {activeSelector === type && (
                    <>
                        <div className="condition-selector-backdrop" onClick={() => setActiveSelector(null)} />
                        <div className="picker-popover">
                            {isNullable && (
                                <button onClick={() => handleSelect(null)}>-</button>
                            )}
                            <button className="random-btn" onClick={() => handleSelect('R')}>R</button>
                            {digitOptions.map((d, i) => (
                                <button key={i} onClick={() => handleSelect(d)}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </>
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
                            <>
                                <div className="condition-selector-backdrop" onClick={() => setActiveSelector(null)} />
                                <div className="picker-popover single-col">
                                    <button className="random-btn" onClick={() => handleSelect('R')}>R</button>
                                    {totalOptions.map(t => (
                                        <button key={t} onClick={() => handleSelect(t)}>{t}</button>
                                    ))}
                                </div>
                            </>
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
                            <>
                                <div className="condition-selector-backdrop" onClick={() => setActiveSelector(null)} />
                                <div className="picker-popover">
                                    <button className="random-btn" onClick={() => handleSelect('R')}>R</button>
                                    {rowOptions.map(r => (
                                        <button key={r} onClick={() => handleSelect(r)}>{r}</button>
                                    ))}
                                </div>
                            </>
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
                                <>
                                    <div className="condition-selector-backdrop" onClick={() => setActiveSelector(null)} />
                                    <div className="picker-popover">
                                        <button className="random-btn" onClick={() => handleSelect('R')}>R</button>
                                        {lengths.map(l => (
                                            <button key={l} onClick={() => handleSelect(l)}>{l}</button>
                                        ))}
                                    </div>
                                </>
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
                                <>
                                    <div className="condition-selector-backdrop" onClick={() => setActiveSelector(null)} />
                                    <div className="picker-popover">
                                        <button className="random-btn" onClick={() => handleSelect('R')}>R</button>
                                        {lengths.map(l => (
                                            <button key={l} onClick={() => handleSelect(l)}>{l}</button>
                                        ))}
                                    </div>
                                </>
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

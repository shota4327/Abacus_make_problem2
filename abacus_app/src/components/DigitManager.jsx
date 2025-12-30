import React, { useState, useMemo } from 'react';
import './DigitManager.css';

const DigitManager = ({ rowDigitCounts, totalRowDigits, updateRowDigitCount, minDigit, maxDigit }) => {
    const [activeSelector, setActiveSelector] = useState(null); // { rowIndex }

    const lengths = useMemo(() => {
        const min = Math.min(minDigit || 5, maxDigit || 12);
        const max = Math.max(minDigit || 5, maxDigit || 12);
        const res = [];
        for (let i = min; i <= max; i++) res.push(i);
        return res;
    }, [minDigit, maxDigit]);

    const handleLengthSelect = (rowIndex, length) => {
        updateRowDigitCount(rowIndex, length);
        setActiveSelector(null);
    };

    return (
        <div className="panel digit-panel">
            <h2>桁数管理</h2>
            <div className="digit-manager-content">
                <div className="grid-header-spacer"></div>
                <div className="digit-rows-container">
                    {rowDigitCounts.map((count, index) => (
                        <div key={index} className="digit-row-item">
                            <span className="row-num">{index + 1}</span>
                            <div className="digit-button-wrapper">
                                <button
                                    className="digit-length-btn"
                                    onClick={() => setActiveSelector(activeSelector?.rowIndex === index ? null : { rowIndex: index })}
                                >
                                    {count}
                                </button>
                                {activeSelector?.rowIndex === index && (
                                    <>
                                        <div className="digit-selector-backdrop" onClick={() => setActiveSelector(null)} />
                                        <div className="length-selector-overlay">
                                            <div className="length-selector-grid">
                                                <button
                                                    className="length-opt-btn random-btn"
                                                    onClick={() => handleLengthSelect(index, lengths[Math.floor(Math.random() * lengths.length)])}
                                                >
                                                    R
                                                </button>
                                                {lengths.map(len => (
                                                    <button
                                                        key={len}
                                                        className="length-opt-btn"
                                                        onClick={() => handleLengthSelect(index, len)}
                                                    >
                                                        {len}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="digit-total-row">
                    <span className="total-label">合計</span>
                    <span className="total-value">{totalRowDigits}</span>
                </div>
            </div>
        </div>
    );
};

export default DigitManager;

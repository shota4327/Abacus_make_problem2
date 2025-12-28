import React, { useState } from 'react';
import './ConditionPanel.css';

const ConditionPanel = ({ minDigit, maxDigit, setMinDigit, setMaxDigit, targetTotalDigits, setTargetTotalDigits, rowCount, setRowCount }) => {
    const [activeSelector, setActiveSelector] = useState(null); // 'min' | 'max' | 'total' | 'rows' | null
    const lengths = [5, 6, 7, 8, 9, 10, 11, 12];
    const totalOptions = [120, 130, 140];
    const rowOptions = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const handleSelect = (val) => {
        if (activeSelector === 'min') {
            setMinDigit(Math.min(val, maxDigit));
        } else if (activeSelector === 'max') {
            setMaxDigit(Math.max(val, minDigit));
        } else if (activeSelector === 'total') {
            setTargetTotalDigits(val);
        } else if (activeSelector === 'rows') {
            setRowCount(val);
        }
        setActiveSelector(null);
    };

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
                <div className="condition-item">＋１文字: -</div>
                <div className="condition-item">－１文字: -</div>
                <div className="condition-item">囲み文字: -</div>
                <div className="condition-item">はさまれ文字: -</div>
                <div className="condition-item">連続文字: -</div>
                <div className="condition-item">マイナス: -</div>
                <div className="condition-item">１口目: -</div>
                <div className="condition-item">最終口: -</div>
                <div className="condition-item">答え: -</div>
            </div>
        </div>
    );
};

export default ConditionPanel;

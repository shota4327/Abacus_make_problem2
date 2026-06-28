import React, { useState, useMemo } from 'react';
import './Stats.css';

const DivisionFrequencyCounter = ({
    frequency,
    totalFrequency,
    frequencyDiffs,
    rowDigitCounts,
    totalRowDigits,
    targetTotalDigits,
    updateRowDigitCount,
    minDigit,
    maxDigit,
    title = "出現回数",
    readOnlyDigitCount = false,
    warnThreshold = 3,
    noPanel = false,
    hideNoColumn = false
}) => {
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

    const totalDigitsDiff = (totalRowDigits || 0) - (targetTotalDigits || 0);

    return (
        <div className={noPanel ? "stats-panel-inner" : "panel stats-panel"} style={noPanel ? { display: 'flex', flexDirection: 'column' } : {}}>
            <h2>{title}</h2>
            <div className="frequency-table-container">
                <table className="frequency-table division-frequency" style={{ width: 'max-content', tableLayout: 'auto' }}>
                    <thead>
                        <tr>
                            {!hideNoColumn && <th className="no-col-header" style={{ width: '40px', minWidth: '40px' }}>No</th>}
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <th key={num} className={num % 2 !== 0 ? 'highlight-orange-light' : ''} style={{ width: '32px', minWidth: '32px' }}>{num}</th>
                            ))}
                            <th className="digit-col-header" style={{ width: '50px', minWidth: '50px' }}>桁数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {frequency.map((rowFreq, rowIndex) => (
                            <tr key={rowIndex}>
                                {!hideNoColumn && <td className="row-label" style={{ width: '40px', minWidth: '40px', borderRight: '1px solid #f1f5f9' }}>{rowIndex + 1}</td>}
                                {rowFreq.map((count, num) => (
                                    <td key={num} className={`${count >= warnThreshold ? 'warn' : ''} ${num % 2 !== 0 ? 'highlight-orange-light' : ''}`} style={{ width: '32px', minWidth: '32px' }}>
                                        {count > 0 ? count : ''}
                                    </td>
                                ))}
                                <td className="digit-col-cell" style={{ width: '50px', minWidth: '50px' }}>
                                    <div className="digit-button-wrapper">
                                        {readOnlyDigitCount ? (
                                            <span className="digit-count-text">
                                                {rowDigitCounts?.[rowIndex] || '-'}
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    className="digit-length-btn"
                                                    onClick={() => setActiveSelector(activeSelector?.rowIndex === rowIndex ? null : { rowIndex })}
                                                >
                                                    {rowDigitCounts?.[rowIndex] || '-'}
                                                </button>
                                                {activeSelector?.rowIndex === rowIndex && (
                                                    <>
                                                        <div className="digit-selector-backdrop" onClick={() => setActiveSelector(null)} />
                                                        <div className="length-selector-overlay">
                                                            <div className="length-selector-grid">
                                                                <button
                                                                    className="length-opt-btn random-btn"
                                                                    onClick={() => handleLengthSelect(rowIndex, lengths[Math.floor(Math.random() * lengths.length)])}
                                                                >
                                                                    R
                                                                </button>
                                                                {lengths.map(len => (
                                                                    <button
                                                                        key={len}
                                                                        className="length-opt-btn"
                                                                        onClick={() => handleLengthSelect(rowIndex, len)}
                                                                    >
                                                                        {len}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row">
                            {!hideNoColumn && <td className="row-label" style={{ width: '40px', minWidth: '40px', borderRight: '1px solid #f1f5f9' }}>合計</td>}
                            {totalFrequency?.map((count, num) => (
                                <td key={num} className={num % 2 !== 0 ? 'highlight-orange-light' : ''} style={{ width: '32px', minWidth: '32px' }}>
                                    {count}
                                </td>
                            ))}
                            <td className="digit-col-cell" style={{ width: '50px', minWidth: '50px' }}>
                                {totalRowDigits}
                            </td>
                        </tr>
                        {frequencyDiffs && frequencyDiffs.length > 0 && (
                            <tr className="diff-row">
                                {!hideNoColumn && <td className="row-label" style={{ width: '40px', minWidth: '40px', borderRight: '1px solid #f1f5f9' }}>過不足</td>}
                                {frequencyDiffs.map((diff, num) => (
                                    <td key={num} className={`${num % 2 !== 0 ? 'highlight-orange-light' : ''} ${diff > 0 ? 'pos' : diff < 0 ? 'neg' : ''}`} style={{ width: '32px', minWidth: '32px' }}>
                                        {diff > 0 ? `+${diff}` : diff}
                                    </td>
                                ))}
                                <td className={`digit-col-cell ${totalDigitsDiff > 0 ? 'pos' : totalDigitsDiff < 0 ? 'neg' : ''}`} style={{ width: '50px', minWidth: '50px' }}>
                                    {totalDigitsDiff > 0 ? `+${totalDigitsDiff}` : totalDigitsDiff}
                                </td>
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default DivisionFrequencyCounter;

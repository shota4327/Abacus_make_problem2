import React, { useState } from 'react';
import './ProblemGrid.css';

const ProblemGrid = ({ grid, updateDigit, isMinusRows, toggleRowMinus, totalSum, generateRandomGrid }) => {
    const [activeCell, setActiveCell] = useState(null); // {row, col}

    const handleCellClick = (row, col) => {
        setActiveCell({ row, col });
    };

    const handleDigitSelect = (value, e) => {
        e.stopPropagation();
        if (activeCell) {
            updateDigit(activeCell.row, activeCell.col, value);
            setActiveCell(null);
        }
    };

    return (
        <div className="panel problem-area">
            <h2>問題作成エリア</h2>
            <div className="grid-container">
                <div className="grid-header-spacer"></div>
                {grid.map((row, rowIndex) => {
                    const firstNonZeroIndex = row.findIndex(d => d !== null && d !== 0);
                    const isMinus = isMinusRows?.[rowIndex];
                    return (
                        <div key={rowIndex} className={`grid-row ${isMinus ? 'minus-row' : ''}`}>
                            <span className="row-number">{rowIndex + 1}</span>
                            <button
                                className={`minus-toggle ${isMinus ? 'active' : ''}`}
                                onClick={() => toggleRowMinus(rowIndex)}
                                title="正負切り替え"
                            >
                                {isMinus ? '－' : ''}
                            </button>
                            {row.map((digit, colIndex) => {
                                const isLeading = colIndex === 0 ? true : (firstNonZeroIndex === -1 || colIndex < firstNonZeroIndex);
                                const isActive = activeCell?.row === rowIndex && activeCell?.col === colIndex;

                                // Highlighting logic
                                let highlighted = false;
                                if (colIndex > 0 && !isLeading) {
                                    const d = row[colIndex];
                                    // Adjacent: d1 == d2
                                    const hasAdjLeft = colIndex > 1 && d === row[colIndex - 1];
                                    const hasAdjRight = colIndex < 12 && d === row[colIndex + 1];

                                    // One-gap: d1 == d3 (highlight d1, d2, d3)
                                    const hasGapLeft = colIndex > 2 && d === row[colIndex - 2];
                                    const hasGapRight = colIndex < 11 && d === row[colIndex + 2];
                                    const isGapMiddle = colIndex > 1 && colIndex < 12 && row[colIndex - 1] === row[colIndex + 1];

                                    if (hasAdjLeft || hasAdjRight || hasGapLeft || hasGapRight || isGapMiddle) {
                                        highlighted = true;
                                    }
                                }

                                return (
                                    <div key={colIndex} className="digit-btn-wrapper">
                                        <button
                                            className={`digit-btn ${isActive ? 'active' : ''} ${highlighted ? 'highlight-same' : ''}`}
                                            onClick={() => handleCellClick(rowIndex, colIndex)}
                                            disabled={colIndex === 0}
                                            style={colIndex === 0 ? { visibility: 'hidden', pointerEvents: 'none' } : {}}
                                        >
                                            {isLeading ? '' : (digit ?? 0)}
                                        </button>
                                        {isActive && (
                                            <>
                                                <div className="selector-backdrop" onClick={() => setActiveCell(null)} />
                                                {(() => {
                                                    // rowNumber(30) + minus-toggle(20) + margin + 13cols(20*13)
                                                    // Actual panel width measured by browser is ~368px.
                                                    // grid-container has some padding. Let's use 325 as conservative visible width.
                                                    const colStart = 55 + colIndex * 20;
                                                    const colCenter = colStart + 10;
                                                    const safetyBuffer = 8; // Increased for more comfortable margin
                                                    const halfPop = 75 + safetyBuffer; // Popup width is 150px
                                                    const areaWidth = 315; // Decreased to push left earlier

                                                    let shift = 0;
                                                    if (colCenter < halfPop) {
                                                        shift = halfPop - colCenter;
                                                    } else if (colCenter > (areaWidth - halfPop)) {
                                                        shift = (areaWidth - halfPop) - colCenter;
                                                    }

                                                    return (
                                                        <div
                                                            className="digit-selector"
                                                            style={{
                                                                left: '50%',
                                                                transform: `translateX(calc(-50% + ${shift}px))`
                                                            }}
                                                        >
                                                            <button
                                                                className="random-btn"
                                                                onClick={(e) => handleDigitSelect(Math.floor(Math.random() * 10), e)}
                                                            >
                                                                R
                                                            </button>
                                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                                                <button key={num} onClick={(e) => handleDigitSelect(num, e)}>{num}</button>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
                <div className="total-row grid-row">
                    <span className="row-number">合計</span>
                    {(() => {
                        const absSum = Math.abs(totalSum);
                        const isSumMinus = totalSum < 0;
                        const sumStr = absSum.toString();
                        const sumDigits = sumStr.split('').map(Number);
                        // Sign index logic
                        const signIndex = 13 - sumDigits.length - 1;
                        const showSignLeft = isSumMinus && signIndex < 0;

                        return (
                            <>
                                <div className="minus-toggle-placeholder" id="total-minus-placeholder">
                                    {showSignLeft && (
                                        <span className="minus-text" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>－</span>
                                    )}
                                </div>
                                {(() => {
                                    const paddedSum = Array(13).fill(null);

                                    // Right-align sum digits into the 13-column grid
                                    for (let i = 0; i < sumDigits.length; i++) {
                                        const gridIdx = 13 - sumDigits.length + i;
                                        if (gridIdx >= 0 && gridIdx < 13) {
                                            paddedSum[gridIdx] = sumDigits[i];
                                        }
                                    }

                                    return paddedSum.map((digit, colIndex) => {
                                        const showSignGrid = isSumMinus && colIndex === signIndex;
                                        return (
                                            <div key={colIndex} className="digit-btn-wrapper">
                                                <span className={`total-digit-val ${isSumMinus ? 'minus-text' : ''}`}>
                                                    {showSignGrid ? '－' : (digit !== null ? digit : '')}
                                                </span>
                                            </div>
                                        );
                                    });
                                })()}
                            </>
                        );
                    })()}
                </div>
            </div>

            <div className="grid-footer">
                <button className="generate-btn" onClick={generateRandomGrid}>
                    再生成
                </button>
            </div>
        </div>
    );
};

export default ProblemGrid;

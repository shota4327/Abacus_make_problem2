import React, { useState } from 'react';
import './ProblemGrid.css';

const ProblemGrid = ({ grid, updateDigit, totalSum, generateRandomGrid }) => {
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
                    return (
                        <div key={rowIndex} className="grid-row">
                            <span className="row-number">{rowIndex + 1}</span>
                            {row.map((digit, colIndex) => {
                                const isLeading = firstNonZeroIndex === -1 || colIndex < firstNonZeroIndex;
                                const isActive = activeCell?.row === rowIndex && activeCell?.col === colIndex;
                                return (
                                    <div key={colIndex} className="digit-btn-wrapper">
                                        <button
                                            className={`digit-btn ${isActive ? 'active' : ''}`}
                                            onClick={() => handleCellClick(rowIndex, colIndex)}
                                        >
                                            {isLeading ? '' : (digit ?? 0)}
                                        </button>
                                        {isActive && (
                                            <>
                                                <div className="selector-backdrop" onClick={() => setActiveCell(null)} />
                                                {(() => {
                                                    // Calculate minimal shift to keep 182px popover inside ~270px area
                                                    // rowNumber(25) + margin(5) + 12cols(20*12) = 270px
                                                    const colStart = 30 + colIndex * 20;
                                                    const colCenter = colStart + 10;
                                                    const safetyBuffer = 1;
                                                    const halfPop = 92 + safetyBuffer; // popWidth/2 + margin
                                                    const areaWidth = 270;

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
                <div className="total-row">
                    <span>合計:</span>
                    <span>{totalSum.toLocaleString()}</span>
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

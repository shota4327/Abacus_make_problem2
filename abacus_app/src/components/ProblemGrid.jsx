import React, { useState } from 'react';
import './ProblemGrid.css';

const ProblemGrid = ({ grid, updateDigit, totalSum }) => {
    const [activeCell, setActiveCell] = useState(null); // {row, col}

    const handleCellClick = (row, col) => {
        setActiveCell({ row, col });
    };

    const handleDigitSelect = (value) => {
        if (activeCell) {
            updateDigit(activeCell.row, activeCell.col, value);
            setActiveCell(null); // Close popover/input logic
        }
    };

    return (
        <div className="panel problem-area">
            <h2>問題作成エリア</h2>
            <div className="grid-container">
                <div className="grid-header-spacer"></div>
                {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid-row">
                        <span className="row-number">{rowIndex + 1}</span>
                        {row.map((digit, colIndex) => (
                            <button
                                key={colIndex}
                                className={`digit-btn ${activeCell?.row === rowIndex && activeCell?.col === colIndex ? 'active' : ''}`}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                            >
                                {digit}
                            </button>
                        ))}
                    </div>
                ))}
                <div className="total-row">
                    <span>合計:</span>
                    <span>{totalSum.toLocaleString()}</span>
                </div>
            </div>

            {activeCell && (
                <div className="digit-selector-overlay" onClick={() => setActiveCell(null)}>
                    <div className="digit-selector" onClick={e => e.stopPropagation()}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num} onClick={() => handleDigitSelect(num)}>{num}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProblemGrid;

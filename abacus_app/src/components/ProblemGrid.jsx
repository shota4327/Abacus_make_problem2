import React, { useState, useRef } from 'react';
import './ProblemGrid.css';

const ProblemGrid = ({
    grid, updateDigit, rowCount, isMinusRows, toggleRowMinus, totalSum,
    generateRandomGrid, isMinusAllowed, setIsMinusAllowed,
    pageIndex, importState, currentConditions
}) => {
    const [activeCell, setActiveCell] = useState(null); // {row, col}
    const fileInputRef = useRef(null);

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

    // --- CSV Helper Methods ---

    const handleExportCSV = () => {
        const header = "種類,値\n";

        // Data Rows
        let csvBody = "";

        // 1. Grid Rows
        for (let ri = 0; ri < rowCount; ri++) {
            const row = grid[ri];
            // Format value
            let rowValStr = "";
            let isLeading = true;
            row.forEach(d => {
                const val = d === null ? 0 : d;
                if (val !== 0) isLeading = false;
                rowValStr += val;
                // Note: Ignoring leading zeros in string rep? 
                // Wait, typically we want full string? Or value?
                // Mitorizan typically aligns right.
                // Let's output integer value of the row.
            });
            let val = parseInt(rowValStr || "0", 10);
            if (isMinusRows[ri]) val = -val;

            csvBody += `${ri + 1},${val}\n`;
        }

        // 2. Total Row
        csvBody += `合計,${totalSum}\n`;

        // 3. Conditions
        // Format: ConditionName,Value
        const c = currentConditions;
        csvBody += `最低桁数,${c.minDigit}\n`;
        csvBody += `最高桁数,${c.maxDigit}\n`;
        csvBody += `合計桁数,${c.targetTotalDigits}\n`;
        csvBody += `口数,${c.rowCount}\n`;
        csvBody += `マイナス許可,${c.isMinusAllowed ? 1 : 0}\n`;
        csvBody += `+1文字,${c.plusOneDigit ?? ''}\n`;
        csvBody += ` -1文字,${c.minusOneDigit ?? ''}\n`;
        csvBody += `囲み文字,${c.enclosedDigit ?? ''}\n`;
        csvBody += `はさまれ文字,${c.sandwichedDigit ?? ''}\n`;
        csvBody += `連続文字,${c.consecutiveDigit ?? ''}\n`;
        csvBody += `初口最小,${c.firstRowMin ?? ''}\n`;
        csvBody += `初口最大,${c.firstRowMax ?? ''}\n`;
        csvBody += `末口最小,${c.lastRowMin ?? ''}\n`;
        csvBody += `末口最大,${c.lastRowMax ?? ''}\n`;
        csvBody += `答え最小,${c.answerMin ?? ''}\n`;
        csvBody += `答え最大,${c.answerMax ?? ''}\n`;

        const csvContent = "\uFEFF" + header + csvBody;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Mitorizan_No${pageIndex || 1}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');

            // Skip header (1st line)
            // Lines 2..(rowCount+1) are data
            // Then Total
            // Then Conditions

            const newState = {
                grid: undefined,
                isMinusRows: undefined,
                rowCount: undefined,
                // conditions
            };

            const newGridRows = [];
            const newMinusRows = [];
            let readingGrid = true;

            // Helper to parse line: "Key,Value"
            const parseLine = (line) => line.split(',');

            // Default condition checks
            const conditionsMap = {};

            for (let i = 1; i < lines.length; i++) {
                const parts = parseLine(lines[i]);
                if (parts.length < 2) continue;

                const col1 = parts[0].trim(); // RowNum or Condition Name
                const col2 = parts[1].trim(); // Value

                // Check if Total row (switch mode)
                if (col1 === '合計') {
                    readingGrid = false;
                    continue; // Skip processing total val used for check only
                }

                if (readingGrid) {
                    // Expecting number or row index
                    // If col1 is numeric, it's a row
                    if (!isNaN(parseInt(col1))) {
                        const val = parseInt(col2, 10);
                        const isMinus = val < 0;
                        const absVal = Math.abs(val);

                        // Convert absVal to digit array (right aligned in 13 cols)
                        const str = absVal.toString();
                        const rowArr = Array(13).fill(null);
                        const offset = 13 - str.length;
                        for (let k = 0; k < str.length; k++) {
                            if (offset + k >= 0 && offset + k < 13) {
                                rowArr[offset + k] = parseInt(str[k], 10);
                            }
                        }

                        // Handle 0 or empty?
                        // If val is 0, is it empty or just 0?
                        // Assuming valid problem rows are numbers. 0 is valid digit row.

                        newGridRows.push(rowArr);
                        newMinusRows.push(isMinus);
                    } else {
                        // Might have hit non-numeric earlier than expected
                        readingGrid = false;
                        // Process as condition
                    }
                }

                if (!readingGrid && col1 !== '合計') {
                    // Condition parsing
                    conditionsMap[col1] = col2;
                }
            }

            // Reconstruct full grid (20 rows max)
            const fullGrid = Array(20).fill(null).map(() => Array(13).fill(null));
            const fullMinus = Array(20).fill(false);

            newGridRows.forEach((r, idx) => fullGrid[idx] = r);
            newMinusRows.forEach((m, idx) => fullMinus[idx] = m);

            newState.grid = fullGrid;
            newState.isMinusRows = fullMinus;
            newState.rowCount = newGridRows.length; // From parse count

            // Apply conditions
            const safeInt = (val) => (val && val !== '') ? parseInt(val, 10) : null;
            const safeBool = (val) => val === '1';

            if (conditionsMap['最低桁数']) newState.minDigit = safeInt(conditionsMap['最低桁数']);
            if (conditionsMap['最高桁数']) newState.maxDigit = safeInt(conditionsMap['最高桁数']);
            if (conditionsMap['合計桁数']) newState.targetTotalDigits = safeInt(conditionsMap['合計桁数']);
            if (conditionsMap['口数']) newState.rowCount = safeInt(conditionsMap['口数']); // Overlay
            if (conditionsMap['マイナス許可']) newState.isMinusAllowed = safeBool(conditionsMap['マイナス許可']);

            newState.plusOneDigit = safeInt(conditionsMap['+1文字']);
            newState.minusOneDigit = safeInt(conditionsMap[' -1文字']); // Space due to csv split trim? Check label.
            // Label was " -1文字" (space? no, trimming should remove it, but check export label used)
            // Export used " -1文字". (Leading space).
            // Trim should handle it? 
            // " -1文字".trim() -> "-1文字".
            // Export: " -1文字"
            // Import: col1.trim().
            // So key is "-1文字".

            if (conditionsMap['+1文字']) newState.plusOneDigit = safeInt(conditionsMap['+1文字']);
            // Fallback for key name variations if trim affects it
            if (conditionsMap['-1文字']) newState.minusOneDigit = safeInt(conditionsMap['-1文字']);

            if (conditionsMap['囲み文字']) newState.enclosedDigit = safeInt(conditionsMap['囲み文字']);
            if (conditionsMap['はさまれ文字']) newState.sandwichedDigit = safeInt(conditionsMap['はさまれ文字']);
            if (conditionsMap['連続文字']) newState.consecutiveDigit = safeInt(conditionsMap['連続文字']);

            if (conditionsMap['初口最小']) newState.firstRowMin = safeInt(conditionsMap['初口最小']);
            if (conditionsMap['初口最大']) newState.firstRowMax = safeInt(conditionsMap['初口最大']);
            if (conditionsMap['末口最小']) newState.lastRowMin = safeInt(conditionsMap['末口最小']);
            if (conditionsMap['末口最大']) newState.lastRowMax = safeInt(conditionsMap['末口最大']);
            if (conditionsMap['答え最小']) newState.answerMin = safeInt(conditionsMap['答え最小']);
            if (conditionsMap['答え最大']) newState.answerMax = safeInt(conditionsMap['答え最大']);

            importState(newState);
            e.target.value = '';
        };
        reader.readAsText(file);
    };


    return (
        <div className="panel problem-area">
            <h2>問題作成エリア</h2>
            <div className="grid-container">
                <div className="grid-header-spacer"></div>
                {grid.slice(0, rowCount).map((row, rowIndex) => {
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
                <label className="minus-allowed-label" style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#333' }}>
                    <input
                        type="checkbox"
                        checked={isMinusAllowed}
                        onChange={(e) => setIsMinusAllowed(e.target.checked)}
                        style={{ marginRight: '0.5rem', transform: 'scale(1.2)' }}
                    />
                    マイナス
                </label>
            </div>
            <div className="grid-footer-sub" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
                <button className="csv-btn" onClick={handleExportCSV}>
                    CSVに書き出し
                </button>
                <button className="csv-btn" onClick={handleImportClick}>
                    CSVから読み込み
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".csv"
                    onChange={handleImportCSV}
                />
            </div>
        </div>
    );
};

export default ProblemGrid;

import React, { useState, useRef } from 'react';
import './ProblemGrid.css'; // Reusing existing grid styles where applicable + new specific ones

const MultiplicationGrid = ({ problems, updateDigit, toggleDecimal, generateRandomProblems, replaceProblems }) => {
    // activeCell: { problemIndex, side ('left'|'right'), colIndex }
    const [activeCell, setActiveCell] = useState(null);
    const fileInputRef = useRef(null);

    const handleDigitSelect = (value, e) => {
        e.stopPropagation();
        if (activeCell) {
            updateDigit(activeCell.problemIndex, activeCell.side, activeCell.colIndex, value);
            setActiveCell(null);
        }
    };

    const calculateValue = (digits, decimalIdx) => {
        let str = "";
        for (let i = 0; i < digits.length; i++) {
            // Treat null (unselected) as 0
            const val = digits[i] !== null ? digits[i] : 0;
            str += val;
            if (decimalIdx === i) {
                str += ".";
            }
        }
        if (str === "" || str === ".") return 0;
        return parseFloat(str);
    };

    // --- CSV Helper Methods ---

    // Format a single problem row into CSV string: A,B,Answer
    const formatProblemToCSV = (prob) => {
        const valA = calculateValue(prob.left, prob.decimalLeft);
        const valB = calculateValue(prob.right, prob.decimalRight);
        const ans = valA * valB;

        // Fix precision issues
        // Calculate expected max decimal places based on inputs
        const getDecimals = (n) => {
            if (Number.isInteger(n)) return 0;
            const str = n.toString();
            return str.includes('.') ? str.split('.')[1].length : 0;
        };
        const decimalsA = getDecimals(valA);
        const decimalsB = getDecimals(valB);
        const maxDecimals = decimalsA + decimalsB;

        // Use toFixed to strictly limit decimals to the mathematical expectation
        // parseFloat removes trailing zeros (e.g. "1.500" -> 1.5)
        const cleanAns = parseFloat(ans.toFixed(maxDecimals));

        return `${valA},${valB},${cleanAns}`;
    };

    const handleExportCSV = () => {
        // Generate CSV content
        // Header
        const header = "被乗数,乗数,答え\n";
        const rows = problems.map(prob => formatProblemToCSV(prob)).join("\n");
        const csvContent = "\uFEFF" + header + rows; // Add BOM for Excel compatibility

        // Create Blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'multiplication_problems.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const parseNumberToDigits = (numStr) => {
        // "12.3" -> digits=[..., 1, 2, 3], decimalRight=...
        // "123" -> digits=[..., 1, 2, 3], decimalRight=null
        const cleanStr = numStr.trim();
        if (!cleanStr || cleanStr === '0') {
            return { digits: Array(7).fill(null), decimal: null };
        }

        const hasDecimal = cleanStr.includes('.');
        const digitsOnly = cleanStr.replace('.', '');

        // Limit to last 7 digits if too long (though unlikely for valid problems)
        // Taking last 7 ensures alignment
        const effectiveDigitsStr = digitsOnly.slice(-7);

        const newDigits = Array(7).fill(null);
        const offset = 7 - effectiveDigitsStr.length;

        for (let i = 0; i < effectiveDigitsStr.length; i++) {
            newDigits[offset + i] = parseInt(effectiveDigitsStr[i], 10);
        }

        let decimalIndex = null;
        if (hasDecimal) {
            const dotPos = cleanStr.indexOf('.');
            // Adjust dotPos relative to the 7-digit grid
            // dotPos is index in cleanStr (e.g. 2 in "12.3")
            // This means there are `dotPos` digits before the dot.
            // These digits end at `offset + dotPos - 1`.
            // So decimal is at `offset + dotPos - 1`.

            // Correction: cleanStr might be longer than 7 digits?
            // If we assume input fits in 7 digits (standard abacus problem).
            // If cleanStr is "1000000.5" (8 chars + dot), digitsOnly is 8 chars. slice takes last 7.
            // If we support that, decimal logic gets tricky.
            // Assumption: Input fits in 7 digits.

            decimalIndex = offset + dotPos - 1;

            // Boundary checks
            if (decimalIndex < 0) decimalIndex = null; // Should not happen for valid format
            if (decimalIndex >= 6) decimalIndex = 6; // Cap at end? Decimal at 6 means after last digit.
        }

        return { digits: newDigits, decimal: decimalIndex };
    };

    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');

            // Skip header if present
            // Simple check: if first line contains "被乗数" or is non-numeric
            let startIdx = 0;
            if (lines.length > 0 && (lines[0].includes('被乗数') || isNaN(parseFloat(lines[0].split(',')[0])))) {
                startIdx = 1;
            }

            const newProblems = [];
            let count = 0;

            for (let i = startIdx; i < lines.length && count < 10; i++) {
                const cols = lines[i].split(',');
                if (cols.length < 2) continue; // Need at least A and B

                const strA = cols[0];
                const strB = cols[1];

                const parsedA = parseNumberToDigits(strA);
                const parsedB = parseNumberToDigits(strB);

                newProblems.push({
                    left: parsedA.digits,
                    right: parsedB.digits,
                    decimalLeft: parsedA.decimal,
                    decimalRight: parsedB.decimal,
                });
                count++;
            }

            // Fill remaining if less than 10
            while (newProblems.length < 10) {
                newProblems.push({
                    left: Array(7).fill(null),
                    right: Array(7).fill(null),
                    decimalLeft: null,
                    decimalRight: null,
                });
            }

            replaceProblems(newProblems);

            // Reset input
            e.target.value = '';
        };
        reader.readAsText(file);
    };


    const shouldHighlight = (digits, idx) => {
        const val = digits[idx];
        if (val === null) return false;

        // Check consecutive ( +/- 1 )
        if (idx > 0 && digits[idx - 1] === val) return true;
        if (idx < digits.length - 1 && digits[idx + 1] === val) return true;

        // Check 1-skip ( +/- 2 )
        if (idx > 1 && digits[idx - 2] === val) return true;
        if (idx < digits.length - 2 && digits[idx + 2] === val) return true;

        // Check sandwiched (neighbors match each other) ( A [B] A )
        // Warn if this digit is between two identical digits
        if (idx > 0 && idx < digits.length - 1) {
            const prev = digits[idx - 1];
            const next = digits[idx + 1];
            if (prev !== null && next !== null && prev === next) return true;
        }

        return false;
    };

    const renderDigitButton = (problemIndex, side, colIndex, digit) => {
        const isActive = activeCell?.problemIndex === problemIndex &&
            activeCell?.side === side &&
            activeCell?.colIndex === colIndex;

        // Show decimal toggle only for Right side (B), and only for the first 6 digits (gaps 0-5)
        // Positioned absolutely via CSS
        const showDecimal = side === 'right' && colIndex < 6;
        // Check if decimal is active at this index
        const isDecimalActive = problems[problemIndex].decimalRight === colIndex;

        // Determine full digits array for highlighting context
        const prob = problems[problemIndex];
        const digits = side === 'left' ? prob.left : prob.right;
        const isHighlighted = shouldHighlight(digits, colIndex);

        return (
            <div key={`${side}-${colIndex}`} className="digit-btn-wrapper">
                <button
                    className={`digit-btn ${isActive ? 'active' : ''} ${isHighlighted ? 'highlight-same' : ''}`}
                    onClick={() => setActiveCell({ problemIndex, side, colIndex })}
                >
                    {digit !== null ? digit : ''}
                </button>
                {isActive && (
                    <>
                        <div className="selector-backdrop" onClick={() => setActiveCell(null)} />
                        <div className="digit-selector" style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
                            <button
                                className="random-btn"
                                onClick={(e) => handleDigitSelect(Math.floor(Math.random() * 10), e)}
                            >
                                R
                            </button>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button key={num} onClick={(e) => handleDigitSelect(num, e)}>{num}</button>
                            ))}
                            <button onClick={(e) => handleDigitSelect(null, e)}>Clr</button>
                        </div>
                    </>
                )}
                {showDecimal && (
                    <button
                        className={`decimal-toggle-abs ${isDecimalActive ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleDecimal(problemIndex, 'right', colIndex);
                        }}
                    >
                        .
                    </button>
                )}
            </div>
        );
    };



    return (
        <div className="panel problem-area multiplication-area">
            <h2>問題作成エリア</h2>
            <div className="grid-container multiplication-grid">
                {problems.map((prob, index) => {
                    const valA = calculateValue(prob.left, prob.decimalLeft); // decimalLeft should be null usually but logic handles it
                    const valB = calculateValue(prob.right, prob.decimalRight);
                    const result = valA * valB;

                    // Format result to avoid long floating point ugliness if possible, but keeping it simple for verification
                    // If result is integer, show integer. If float, maybe limit digits?
                    // User just said "display result". standard JS stringification is usually okay for simple calc.
                    // But 0.1 * 0.2 = 0.02000000004. We might want to fix precision.
                    // Let's use a simple precision fix: rounding to a reasonable number of decimals if there's a dot.
                    // For now, simple standard output. String(result).
                    // Actually, for abacus problems, clean decimals are preferred.
                    // Let's rely on standard toString() and maybe trim trailing zeros if we were parsing.
                    // result is a number.
                    let displayResult = result;
                    if (!Number.isInteger(result) && result.toString().length > 10) {
                        displayResult = parseFloat(result.toPrecision(12)); // Clean up tiny errors
                    }

                    // Format result with commas for thousands separator
                    // Use maximumFractionDigits to prevent truncation of decimals
                    const formattedResult = displayResult.toLocaleString('en-US', { maximumFractionDigits: 10 });

                    // Determine color based on fractional part
                    let invalidResultClass = '';
                    if (!Number.isInteger(result)) {
                        const fraction = result % 1;
                        if (fraction >= 0.5) {
                            invalidResultClass = 'round-up'; // Blue
                        } else {
                            invalidResultClass = 'round-down'; // Red
                        }
                    }

                    return (
                        <div key={index} className="multiplication-row">
                            <span className="row-number">{index + 1}</span>

                            {/* LEFT (A) */}
                            <div className="digits-group">
                                <div className="digits-row">
                                    {prob.left.map((d, i) => renderDigitButton(index, 'left', i, d))}
                                </div>
                                {/* Decimal buttons buttons removed for Factor A as requested */}
                            </div>

                            <div className="operator">×</div>

                            {/* RIGHT (B) */}
                            <div className="digits-group">
                                <div className="digits-row">
                                    {prob.right.map((d, i) => renderDigitButton(index, 'right', i, d))}
                                </div>
                                {/* Decimal buttons moved inside digit wrappers */}
                            </div>

                            <div className="operator">＝</div>

                            {/* ANSWER PLACEHOLDER */}
                            <div className="digits-group answer-group">
                                <div className="digits-row">
                                    <span className={`answer-placeholder ${invalidResultClass}`}>{formattedResult}</span>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>
            <div className="grid-footer">
                <div className="footer-left">
                    {/* Spacers or other left-aligned items if any */}
                </div>
                <div className="footer-right">
                    <button className="generate-btn" onClick={generateRandomProblems}>
                        再生成
                    </button>
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
        </div>
    );
};

export default MultiplicationGrid;

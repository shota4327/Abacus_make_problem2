import React, { useState } from 'react';
import './ProblemGrid.css'; // Reusing existing grid styles where applicable + new specific ones

const MultiplicationGrid = ({ problems, updateDigit, toggleDecimal, generateRandomProblems }) => {
    // activeCell: { problemIndex, side ('left'|'right'), colIndex }
    const [activeCell, setActiveCell] = useState(null);

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
                                {/* Decimal buttons removed for Factor A as requested */}
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
                <button className="generate-btn" onClick={generateRandomProblems}>
                    再生成
                </button>
            </div>
        </div>
    );
};

export default MultiplicationGrid;

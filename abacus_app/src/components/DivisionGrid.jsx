import React, { useState, useRef } from 'react';
import './ProblemGrid.css';
import './Multiplication.css'; // 乗算と同じスタイルを使用

const DivisionGrid = ({ problems, updateDigit, toggleDecimal, generateRandomProblems, replaceProblems }) => {
    // activeCell: { problemIndex, field ('dividend'|'divisor'|'answer'), colIndex }
    const [activeCell, setActiveCell] = useState(null);
    const fileInputRef = useRef(null);

    const handleDigitSelect = (value, e) => {
        e.stopPropagation();
        if (activeCell) {
            updateDigit(activeCell.problemIndex, activeCell.field, activeCell.colIndex, value);
            setActiveCell(null);
        }
    };

    const calculateValue = (digits, decimalIdx) => {
        let str = "";
        for (let i = 0; i < digits.length; i++) {
            const val = digits[i] !== null ? digits[i] : 0;
            str += val;
            if (decimalIdx === i) {
                str += ".";
            }
        }
        if (str === "" || str === ".") return 0;
        return parseFloat(str);
    };

    // CSV Format: 割られる数,割る数,答え
    const formatProblemToCSV = (prob) => {
        const valDiv = calculateValue(prob.dividend, prob.decimalDividend);
        const valDvr = calculateValue(prob.divisor, prob.decimalDivisor);
        const valAns = calculateValue(prob.answer, prob.decimalAnswer);
        return `${valDiv},${valDvr},${valAns}`;
    };

    const handleExportCSV = () => {
        const header = "割られる数,割る数,答え\n";
        const rows = problems.map(prob => formatProblemToCSV(prob)).join("\n");
        const csvContent = "\uFEFF" + header + rows;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'division_problems.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const parseNumberToDigits = (numStr, maxLength) => {
        const cleanStr = numStr.trim();
        if (!cleanStr || cleanStr === '0') {
            return { digits: Array(maxLength).fill(null), decimal: null };
        }

        const hasDecimal = cleanStr.includes('.');
        const digitsOnly = cleanStr.replace('.', '');
        const effectiveDigitsStr = digitsOnly.slice(-maxLength);

        const newDigits = Array(maxLength).fill(null);
        const offset = maxLength - effectiveDigitsStr.length;

        for (let i = 0; i < effectiveDigitsStr.length; i++) {
            newDigits[offset + i] = parseInt(effectiveDigitsStr[i], 10);
        }

        let decimalIndex = null;
        if (hasDecimal) {
            const dotPos = cleanStr.indexOf('.');
            decimalIndex = offset + dotPos - 1;
            if (decimalIndex < 0) decimalIndex = null;
            if (decimalIndex >= maxLength - 1) decimalIndex = maxLength - 1;
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

            let startIdx = 0;
            if (lines.length > 0 && (lines[0].includes('割られる数') || isNaN(parseFloat(lines[0].split(',')[0])))) {
                startIdx = 1;
            }

            const newProblems = [];
            let count = 0;

            for (let i = startIdx; i < lines.length && count < 10; i++) {
                const cols = lines[i].split(',');
                if (cols.length < 2) continue;

                const strDiv = cols[0];
                const strDvr = cols[1];
                const strAns = cols.length > 2 ? cols[2] : "";

                const parsedDiv = parseNumberToDigits(strDiv, 14);
                const parsedDvr = parseNumberToDigits(strDvr, 7);
                const parsedAns = parseNumberToDigits(strAns, 7);

                newProblems.push({
                    dividend: parsedDiv.digits,
                    decimalDividend: parsedDiv.decimal,
                    divisor: parsedDvr.digits,
                    decimalDivisor: parsedDvr.decimal,
                    answer: parsedAns.digits,
                    decimalAnswer: parsedAns.decimal
                });
                count++;
            }

            while (newProblems.length < 10) {
                newProblems.push({
                    dividend: Array(14).fill(null),
                    decimalDividend: null,
                    divisor: Array(7).fill(null),
                    decimalDivisor: null,
                    answer: Array(7).fill(null),
                    decimalAnswer: null
                });
            }

            replaceProblems(newProblems);
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const shouldHighlight = (digits, idx) => {
        const val = digits[idx];
        if (val === null) return false;
        if (idx > 0 && digits[idx - 1] === val) return true;
        if (idx < digits.length - 1 && digits[idx + 1] === val) return true;
        if (idx > 1 && digits[idx - 2] === val) return true;
        if (idx < digits.length - 2 && digits[idx + 2] === val) return true;
        if (idx > 0 && idx < digits.length - 1) {
            const prev = digits[idx - 1];
            const next = digits[idx + 1];
            if (prev !== null && next !== null && prev === next) return true;
        }
        return false;
    };

    const renderDigitButton = (problemIndex, field, colIndex, digit) => {
        const isActive = activeCell?.problemIndex === problemIndex &&
            activeCell?.field === field &&
            activeCell?.colIndex === colIndex;

        // 小数点のボタンは割る数（divisor）だけにつける
        const showDecimal = field === 'divisor' && colIndex < 6;
        const decimalKey = 'decimal' + field.charAt(0).toUpperCase() + field.slice(1);
        const isDecimalActive = problems[problemIndex][decimalKey] === colIndex;

        const prob = problems[problemIndex];
        const digits = prob[field];
        const isHighlighted = shouldHighlight(digits, colIndex);

        return (
            <div key={`${field}-${colIndex}`} className="digit-btn-wrapper">
                <button
                    className={`digit-btn ${isActive ? 'active' : ''} ${isHighlighted ? 'highlight-same' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveCell({ problemIndex, field, colIndex });
                    }}
                >
                    {digit !== null ? digit : ''}
                </button>
                {isActive && (
                    <>
                        <div className="selector-backdrop" onClick={(e) => { e.stopPropagation(); setActiveCell(null); }} />
                        <div className="digit-selector" style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
                            <button className="random-btn" onClick={(e) => handleDigitSelect(Math.floor(Math.random() * 10), e)}>R</button>
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
                            toggleDecimal(problemIndex, field, colIndex);
                        }}
                    >
                        .
                    </button>
                )}
            </div>
        );
    };

    const renderRow = (prob, index) => {
        return (
            <div key={index} className="multiplication-row" style={{ paddingBottom: '5px' }}>
                {/* 問題番号 */}
                <span className="row-number" style={{ width: '20px', fontWeight: 'bold' }}>{index + 1}</span>

                {/* 割られる数 (Dividend) */}
                <div className="digits-group">
                    <div className="digits-row">
                        {prob.dividend.map((d, i) => renderDigitButton(index, 'dividend', i, d))}
                    </div>
                </div>

                <div className="operator">÷</div>

                {/* 割る数 (Divisor) */}
                <div className="digits-group">
                    <div className="digits-row">
                        {prob.divisor.map((d, i) => renderDigitButton(index, 'divisor', i, d))}
                    </div>
                </div>

                <div className="operator">＝</div>

                {/* 答え (Answer) */}
                <div className="digits-group">
                    <div className="digits-row">
                        {prob.answer.map((d, i) => renderDigitButton(index, 'answer', i, d))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="panel problem-area multiplication-area" style={{ maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }} onClick={() => setActiveCell(null)}>
            <h2>問題作成エリア</h2>
            <div className="grid-container multiplication-grid" style={{ overflowX: 'auto', padding: '0 5px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', justifyContent: 'center', minWidth: 'fit-content' }}>
                    {/* 左側カラム 1〜5 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 auto' }}>
                        {problems.slice(0, 5).map((prob, idx) => renderRow(prob, idx))}
                    </div>
                    
                    {/* 区切り線 */}
                    <div style={{ width: '3px', backgroundColor: '#888', margin: '0 10px', borderRadius: '2px' }}></div>

                    {/* 右側カラム 6〜10 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 auto' }}>
                        {problems.slice(5, 10).map((prob, idx) => renderRow(prob, idx + 5))}
                    </div>
                </div>
            </div>
            
            <div className="grid-footer" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button className="generate-btn" onClick={generateRandomProblems}>再生成</button>
                <button className="csv-btn export-btn" onClick={handleExportCSV}>CSVに書き出し</button>
                <button className="csv-btn import-btn" onClick={handleImportClick}>CSVから読み込み</button>
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

export default DivisionGrid;

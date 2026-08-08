/**
 * @file DivisionGrid.tsx
 * @description 10問分の割り算問題（割られる数・割る数・商）の数値入力セルグリッド、小数点設定、自動生成ボタン、CSVエクスポート/インポート機能を提供する編集コンポーネントです。
 */

import React, { useState, useRef } from 'react';
import { MAX_DIVIDEND_LENGTH, MAX_DIVISOR_LENGTH, MAX_ANSWER_LENGTH } from '../constants/initialState';
import './ProblemGrid.css';
import './Multiplication.css';
import { DivisionGridProps, DivisionCellPosition, DivisionProblemState } from '../types';

/**
 * 割り算問題10問分の入力・編集グリッドコンポーネント
 * 
 * @param props - コンポーネントProps
 * @param props.problems - 10問分の割り算問題オブジェクト配列
 * @param props.updateDigit - セル数字更新ハンドラー (problemIndex, field, colIndex, value) => void
 * @param props.toggleDecimal - 小数点トグルハンドラー (problemIndex, field, colIndex) => void
 * @param props.generateRandomProblems - 一括自動生成関数
 * @param props.replaceProblems - 問題配列置換関数 (インポート時)
 * @returns 割り算編集グリッドUI
 */
const DivisionGrid: React.FC<DivisionGridProps> = ({ problems, updateDigit, toggleDecimal, generateRandomProblems, replaceProblems }) => {
    // アクティブ選択中セル: { problemIndex, field ('dividend'|'divisor'|'answer'), colIndex } | null
    const [activeCell, setActiveCell] = useState<DivisionCellPosition | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleDigitSelect = (value: number | null, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (activeCell) {
            updateDigit(activeCell.problemIndex, activeCell.field, activeCell.colIndex, value);
            setActiveCell(null);
        }
    };

    const calculateValue = (digits: (number | null)[], decimalIdx: number | null): number => {
        let str = "";
        for (let i = 0; i < digits.length; i++) {
            const val = digits[i] !== null && digits[i] !== undefined ? digits[i] : 0;
            str += val;
            if (decimalIdx === i) {
                str += ".";
            }
        }
        if (str === "" || str === ".") return 0;
        return parseFloat(str);
    };

    // CSV Format: 割られる数,割る数,答え
    const formatProblemToCSV = (prob: DivisionProblemState): string => {
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

    const parseNumberToDigits = (numStr: string, maxLength: number): { digits: (number | null)[]; decimal: number | null } => {
        const cleanStr = numStr.trim();
        if (!cleanStr || cleanStr === '0') {
            return { digits: Array(maxLength).fill(null), decimal: null };
        }

        const hasDecimal = cleanStr.includes('.');
        const digitsOnly = cleanStr.replace('.', '');
        const effectiveDigitsStr = digitsOnly.slice(-maxLength);

        const newDigits: (number | null)[] = Array(maxLength).fill(null);
        const offset = maxLength - effectiveDigitsStr.length;

        for (let i = 0; i < effectiveDigitsStr.length; i++) {
            const char = effectiveDigitsStr[i];
            if (char !== undefined) {
                newDigits[offset + i] = parseInt(char, 10);
            }
        }

        let decimalIndex: number | null = null;
        if (hasDecimal) {
            const dotPos = cleanStr.indexOf('.');
            decimalIndex = offset + dotPos - 1;
            if (decimalIndex < 0) decimalIndex = null;
            if (decimalIndex !== null && decimalIndex >= maxLength - 1) decimalIndex = maxLength - 1;
        }

        return { digits: newDigits, decimal: decimalIndex };
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');

            let startIdx = 0;
            const firstLine = lines[0];
            if (lines.length > 0 && firstLine && (firstLine.includes('割られる数') || isNaN(parseFloat(firstLine.split(',')[0] || '')))) {
                startIdx = 1;
            }

            const newProblems: DivisionProblemState[] = [];
            let count = 0;

            for (let i = startIdx; i < lines.length && count < 10; i++) {
                const line = lines[i];
                if (!line) continue;
                const cols = line.split(',');
                if (cols.length < 2) continue;

                const strDiv = cols[0] || '';
                const strDvr = cols[1] || '';
                const strAns = cols.length > 2 ? (cols[2] || '') : '';

                const parsedDiv = parseNumberToDigits(strDiv, MAX_DIVIDEND_LENGTH);
                const parsedDvr = parseNumberToDigits(strDvr, MAX_DIVISOR_LENGTH);
                const parsedAns = parseNumberToDigits(strAns, MAX_ANSWER_LENGTH);

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
                    dividend: Array(MAX_DIVIDEND_LENGTH).fill(null),
                    decimalDividend: null,
                    divisor: Array(MAX_DIVISOR_LENGTH).fill(null),
                    decimalDivisor: null,
                    answer: Array(MAX_ANSWER_LENGTH).fill(null),
                    decimalAnswer: null
                });
            }

            replaceProblems(newProblems);
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const shouldHighlight = (digits: (number | null)[], idx: number): boolean => {
        const val = digits[idx];
        if (val === null || val === undefined) return false;

        let foundNonZero = false;
        const validIndices: number[] = [];
        let isLeadingZero = false;

        for (let i = 0; i < digits.length; i++) {
            const d = digits[i];
            if (d !== null && d !== undefined) {
                if (d === 0 && !foundNonZero) {
                    if (i === idx) isLeadingZero = true;
                    continue;
                }
                foundNonZero = true;
                validIndices.push(i);
            }
        }

        if (isLeadingZero) return false;

        const vPos = validIndices.indexOf(idx);
        if (vPos === -1) return false;

        const prevIdx = validIndices[vPos - 1];
        const nextIdx = validIndices[vPos + 1];

        if (vPos > 0 && prevIdx !== undefined && digits[prevIdx] === val) return true;
        if (vPos < validIndices.length - 1 && nextIdx !== undefined && digits[nextIdx] === val) return true;

        const skipPrevIdx = validIndices[vPos - 2];
        const skipNextIdx = validIndices[vPos + 2];

        if (vPos > 1 && skipPrevIdx !== undefined && digits[skipPrevIdx] === val) return true;
        if (vPos < validIndices.length - 2 && skipNextIdx !== undefined && digits[skipNextIdx] === val) return true;

        if (vPos > 0 && vPos < validIndices.length - 1 && prevIdx !== undefined && nextIdx !== undefined) {
            const prev = digits[prevIdx];
            const next = digits[nextIdx];
            if (prev !== null && prev !== undefined && next !== null && next !== undefined && prev === next) return true;
        }

        return false;
    };

    const renderDigitButton = (problemIndex: number, field: 'dividend' | 'divisor' | 'answer', colIndex: number, digit: number | null) => {
        const isActive = activeCell?.problemIndex === problemIndex &&
            activeCell?.field === field &&
            activeCell?.colIndex === colIndex;

        const prob = problems[problemIndex];
        if (!prob) return null;

        const showDecimal = field === 'divisor' && colIndex < 6;
        const decimalKey = ('decimal' + field.charAt(0).toUpperCase() + field.slice(1)) as keyof DivisionProblemState;
        const decimalPos = prob[decimalKey] as number | null;
        const isDecimalActive = decimalPos === colIndex;

        const digits = prob[field];
        const isHighlighted = field !== 'dividend' && shouldHighlight(digits, colIndex);
        
        let roundClass = '';
        if (field === 'answer' && prob.roundType) {
            roundClass = `round-${prob.roundType}`;
        }

        let displayDigit = digit;
        if (field === 'divisor' && decimalPos !== null && digit === null) {
            let firstDigitPos = 7;
            for (let i = 0; i < 7; i++) {
                if (digits[i] !== null && digits[i] !== undefined) {
                    firstDigitPos = i;
                    break;
                }
            }
            if (colIndex >= decimalPos && colIndex < firstDigitPos) {
                displayDigit = 0;
            }
        }

        return (
            <div key={`${field}-${colIndex}`} className={`digit-btn-wrapper digit-btn-wrapper-${field}`}>
                <button
                    className={`digit-btn ${isActive ? 'active' : ''} ${isHighlighted ? 'highlight-same' : ''} ${roundClass}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveCell({ problemIndex, field, colIndex });
                    }}
                >
                    {displayDigit !== null && displayDigit !== undefined ? displayDigit : ''}
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

    const renderRow = (prob: DivisionProblemState, index: number) => {
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

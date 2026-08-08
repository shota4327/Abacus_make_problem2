/**
 * @file MultiplicationGrid.tsx
 * @description 掛け算問題10問の盤面セル編集（被乗数・乗数・小数点設置）、自動問題生成、およびCSV出力/入力機能を備えたグリッドコンポーネントです。
 */

import React, { useState, useRef } from 'react';
import './ProblemGrid.css';
import { MultiplicationGridProps, MultiplicationCellPosition, MultiplicationProblemState } from '../types';

/**
 * 掛け算問題10問分入力・編集グリッドコンポーネント
 * 
 * @param props - コンポーネントProps
 * @param props.problems - 10問分の掛け算問題オブジェクト配列
 * @param props.updateDigit - セル数字更新ハンドラー
 * @param props.toggleDecimal - 小数点設定ハンドラー
 * @param props.generateRandomProblems - 一括自動生成関数
 * @param props.replaceProblems - CSVインポート用一括更新関数
 * @returns 掛け算入力グリッドUI
 */
const MultiplicationGrid: React.FC<MultiplicationGridProps> = ({ problems, updateDigit, toggleDecimal, generateRandomProblems, replaceProblems }) => {
    // アクティブ選択セル: { problemIndex, side ('left'|'right'), colIndex } | null
    const [activeCell, setActiveCell] = useState<MultiplicationCellPosition | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleDigitSelect = (value: number | null, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (activeCell) {
            updateDigit(activeCell.problemIndex, activeCell.side, activeCell.colIndex, value);
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

    // --- CSV Helper Methods ---

    const formatProblemToCSV = (prob: MultiplicationProblemState): string => {
        const valA = calculateValue(prob.left, prob.decimalLeft);
        const valB = calculateValue(prob.right, prob.decimalRight);
        const ans = valA * valB;

        const cleanAns = Math.round(ans);

        return `${valA},${valB},${cleanAns}`;
    };

    const handleExportCSV = () => {
        const header = "被乗数,乗数,答え\n";
        const rows = problems.map(prob => formatProblemToCSV(prob)).join("\n");
        const csvContent = "\uFEFF" + header + rows;

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

    const parseNumberToDigits = (numStr: string): { digits: (number | null)[]; decimal: number | null } => {
        const cleanStr = numStr.trim();
        if (!cleanStr || cleanStr === '0') {
            return { digits: Array(7).fill(null), decimal: null };
        }

        const hasDecimal = cleanStr.includes('.');
        const digitsOnly = cleanStr.replace('.', '');

        const effectiveDigitsStr = digitsOnly.slice(-7);

        const newDigits: (number | null)[] = Array(7).fill(null);
        const offset = 7 - effectiveDigitsStr.length;

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
            if (decimalIndex !== null && decimalIndex >= 6) decimalIndex = 6;
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
            if (lines.length > 0 && firstLine && (firstLine.includes('被乗数') || isNaN(parseFloat(firstLine.split(',')[0] || '')))) {
                startIdx = 1;
            }

            const newProblems: MultiplicationProblemState[] = [];
            let count = 0;

            for (let i = startIdx; i < lines.length && count < 10; i++) {
                const line = lines[i];
                if (!line) continue;
                const cols = line.split(',');
                if (cols.length < 2) continue;

                const strA = cols[0] || '';
                const strB = cols[1] || '';

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

            while (newProblems.length < 10) {
                newProblems.push({
                    left: Array(7).fill(null),
                    right: Array(7).fill(null),
                    decimalLeft: null,
                    decimalRight: null,
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

    const renderDigitButton = (problemIndex: number, side: 'left' | 'right', colIndex: number, digit: number | null) => {
        const isActive = activeCell?.problemIndex === problemIndex &&
            activeCell?.side === side &&
            activeCell?.colIndex === colIndex;

        const showDecimal = side === 'right' && colIndex < 6;
        const targetProb = problems[problemIndex];
        const isDecimalActive = targetProb?.decimalRight === colIndex;

        const digits = side === 'left' ? targetProb?.left || [] : targetProb?.right || [];
        const isHighlighted = shouldHighlight(digits, colIndex);

        return (
            <div key={`${side}-${colIndex}`} className="digit-btn-wrapper">
                <button
                    className={`digit-btn ${isActive ? 'active' : ''} ${isHighlighted ? 'highlight-same' : ''}`}
                    onClick={() => setActiveCell({ problemIndex, side, colIndex })}
                >
                    {digit !== null && digit !== undefined ? digit : ''}
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
                    const valA = calculateValue(prob.left, prob.decimalLeft);
                    const valB = calculateValue(prob.right, prob.decimalRight);
                    const result = valA * valB;

                    const roundedResult = Math.round(result);
                    const formattedResult = roundedResult.toLocaleString('en-US');

                    let invalidResultClass = '';
                    if (!Number.isInteger(result)) {
                        const fraction = result % 1;
                        if (fraction >= 0.5) {
                            invalidResultClass = 'round-up';
                        } else {
                            invalidResultClass = 'round-down';
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
                            </div>

                            <div className="operator">×</div>

                            {/* RIGHT (B) */}
                            <div className="digits-group">
                                <div className="digits-row">
                                    {prob.right.map((d, i) => renderDigitButton(index, 'right', i, d))}
                                </div>
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

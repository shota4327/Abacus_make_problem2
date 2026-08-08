/**
 * @file ProblemGrid.tsx
 * @description 見取り算（20行×13列）の各セル数値入力・マイナス切り替え、自動作成ボタン、およびCSV書き出し／読み込み（インポート/エクスポート）を行う盤面描画コンポーネントです。
 */

import React, { useState, useRef } from 'react';
import './ProblemGrid.css';
import { ProblemGridProps, MitorizanCellPosition, ProblemState, Grid } from '../types';

/**
 * 見取り算問題盤面編集コンポーネント
 * 
 * @param props - コンポーネントProps
 * @param props.grid - 20x13の見取り算数値セル配列
 * @param props.updateDigit - セル数字更新ハンドラー (rowIndex, colIndex, value) => void
 * @param props.rowCount - 有効な行数（口数）
 * @param props.isMinusRows - 行別マイナスフラグ配列
 * @param props.toggleRowMinus - 行マイナス切替ハンドラー
 * @param props.totalSum - 総合計（答え）
 * @param props.generateRandomGrid - ランダム自動生成関数
 * @param props.pageIndex - 問題番号 (1-10)
 * @param props.importState - CSVインポート一括更新関数
 * @param props.currentConditions - 現在の問題作問条件スナップショット
 * @returns 見取り算盤面UI
 */
const ProblemGrid: React.FC<ProblemGridProps> = ({
    grid, updateDigit, rowCount, isMinusRows, toggleRowMinus, totalSum,
    generateRandomGrid, pageIndex, importState, currentConditions
}) => {
    /** アクティブ入力選択中セル { row, col } | null */
    const [activeCell, setActiveCell] = useState<MitorizanCellPosition | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleCellClick = (row: number, col: number) => {
        setActiveCell({ row, col });
    };

    const handleDigitSelect = (value: number | null, e: React.MouseEvent<HTMLButtonElement>) => {
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
            if (!row) continue;
            // Format value
            let rowValStr = "";
            row.forEach(d => {
                const val = d === null ? 0 : d;
                rowValStr += val;
            });
            let val = parseInt(rowValStr || "0", 10);
            if (isMinusRows[ri]) val = -val;

            csvBody += `${ri + 1},${val}\n`;
        }

        // 2. Total Row
        csvBody += `合計,${totalSum}\n`;

        // 3. Conditions
        const c = currentConditions;
        csvBody += `最低桁数,${c.minDigit}\n`;
        csvBody += `最高桁数,${c.maxDigit}\n`;
        csvBody += `合計桁数,${c.targetTotalDigits}\n`;
        csvBody += `口数,${c.rowCount}\n`;
        csvBody += `マイナス,${c.hasMinus ? 1 : 0}\n`;
        csvBody += `補数計算,${c.complementStatus ? 1 : 0}\n`;
        csvBody += `+1文字,${c.plusOneDigit ?? ''}\n`;
        csvBody += ` -1文字,${c.minusOneDigit ?? ''}\n`;
        csvBody += `囲み文字,${c.enclosedDigit ?? ''}\n`;
        csvBody += `はさまれ文字,${c.sandwichedDigit ?? ''}\n`;
        csvBody += `連続文字,${c.consecutiveDigit ?? ''}\n`;
        csvBody += `初口先頭,${c.firstRowFirstDigit ?? ''}\n`;
        csvBody += `初口末尾,${c.firstRowLastDigit ?? ''}\n`;
        csvBody += `末口最小,${c.lastRowFirstDigit ?? ''}\n`;
        csvBody += `末口最大,${c.lastRowLastDigit ?? ''}\n`;
        csvBody += `答え最小,${c.answerFirstDigit ?? ''}\n`;
        csvBody += `答え最大,${c.answerLastDigit ?? ''}\n`;

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

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');

            const newState: Partial<ProblemState> = {};

            const newGridRows: (number | null)[][] = [];
            const newMinusRows: boolean[] = [];
            let readingGrid = true;

            const parseLine = (line: string) => line.split(',');

            const conditionsMap: Record<string, string> = {};

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line) continue;
                const parts = parseLine(line);
                if (parts.length < 2) continue;

                const col1 = parts[0]?.trim() || '';
                const col2 = parts[1]?.trim() || '';

                if (col1 === '合計') {
                    readingGrid = false;
                    continue;
                }

                if (readingGrid) {
                    if (!isNaN(parseInt(col1))) {
                        const val = parseInt(col2, 10);
                        const isMinus = val < 0;
                        const absVal = Math.abs(val);

                        const str = absVal.toString();
                        if (str.length > 13) {
                            console.warn(`CSVの値が13桁を超えています（${str.length}桁）。先頭の桁が切り捨てられます。`);
                        }
                        const rowArr: (number | null)[] = Array(13).fill(null);
                        const offset = 13 - str.length;
                        for (let k = 0; k < str.length; k++) {
                            const char = str[k];
                            if (char !== undefined && offset + k >= 0 && offset + k < 13) {
                                rowArr[offset + k] = parseInt(char, 10);
                            }
                        }

                        newGridRows.push(rowArr);
                        newMinusRows.push(isMinus);
                    } else {
                        readingGrid = false;
                    }
                }

                if (!readingGrid && col1 !== '合計') {
                    conditionsMap[col1] = col2;
                }
            }

            const fullGrid: Grid = Array(20).fill(null).map(() => Array(13).fill(null));
            const fullMinus: boolean[] = Array(20).fill(false);

            newGridRows.forEach((r, idx) => { if (fullGrid[idx]) fullGrid[idx] = r; });
            newMinusRows.forEach((m, idx) => { fullMinus[idx] = m; });

            newState.grid = fullGrid;
            newState.isMinusRows = fullMinus;
            newState.rowCount = newGridRows.length;

            const safeInt = (val: string | undefined): number | null => {
                if (!val || val === '') return null;
                const parsed = parseInt(val, 10);
                return Number.isNaN(parsed) ? null : parsed;
            };
            const safeBool = (val: string | undefined): boolean => val === '1';

            if (conditionsMap['最低桁数']) newState.minDigit = safeInt(conditionsMap['最低桁数']) ?? undefined;
            if (conditionsMap['最高桁数']) newState.maxDigit = safeInt(conditionsMap['最高桁数']) ?? undefined;
            if (conditionsMap['合計桁数']) newState.targetTotalDigits = safeInt(conditionsMap['合計桁数']) ?? undefined;
            if (conditionsMap['口数']) newState.rowCount = safeInt(conditionsMap['口数']) ?? undefined;
            if (conditionsMap['マイナス許可']) newState.hasMinus = safeBool(conditionsMap['マイナス許可']);
            if (conditionsMap['マイナス']) newState.hasMinus = safeBool(conditionsMap['マイナス']);
            if (conditionsMap['補数計算']) newState.complementStatus = safeBool(conditionsMap['補数計算']);

            newState.plusOneDigit = safeInt(conditionsMap['+1文字']);
            newState.minusOneDigit = safeInt(conditionsMap[' -1文字']) ?? safeInt(conditionsMap['-1文字']);

            if (conditionsMap['囲み文字']) newState.enclosedDigit = safeInt(conditionsMap['囲み文字']);
            if (conditionsMap['はさまれ文字']) newState.sandwichedDigit = safeInt(conditionsMap['はさまれ文字']);
            if (conditionsMap['連続文字']) newState.consecutiveDigit = safeInt(conditionsMap['連続文字']);

            if (conditionsMap['初口先頭']) newState.firstRowFirstDigit = safeInt(conditionsMap['初口先頭']);
            if (conditionsMap['初口末尾']) newState.firstRowLastDigit = safeInt(conditionsMap['初口末尾']);
            if (conditionsMap['末口最小']) newState.lastRowFirstDigit = safeInt(conditionsMap['末口最小']);
            if (conditionsMap['末口最大']) newState.lastRowLastDigit = safeInt(conditionsMap['末口最大']);
            if (conditionsMap['答え最小']) newState.answerFirstDigit = safeInt(conditionsMap['答え最小']);
            if (conditionsMap['答え最大']) newState.answerLastDigit = safeInt(conditionsMap['答え最大']);

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
                                    const hasAdjLeft = colIndex > 1 && d === row[colIndex - 1];
                                    const hasAdjRight = colIndex < 12 && d === row[colIndex + 1];

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
                                                    const colStart = 55 + colIndex * 20;
                                                    const colCenter = colStart + 10;
                                                    const safetyBuffer = 8;
                                                    const halfPop = 75 + safetyBuffer;
                                                    const areaWidth = 315;

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
                                    const paddedSum: (number | null)[] = Array(13).fill(null);

                                    for (let i = 0; i < sumDigits.length; i++) {
                                        const gridIdx = 13 - sumDigits.length + i;
                                        if (gridIdx >= 0 && gridIdx < 13) {
                                            paddedSum[gridIdx] = sumDigits[i] ?? null;
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

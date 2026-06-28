import { useState, useMemo, useCallback } from 'react';
import { createInitialGrid, ROW_COUNT, COL_COUNT } from '../constants/initialState';
import { calculateProblemStats } from '../utils/problemValidator';
import { generateProblemGrid, generateRandomRow } from '../utils/problemGenerator';

export const useProblemState = (initialData = {}) => {
    // --- 状態の初期化 ---
    const [grid, setGrid] = useState(() => {
        if (initialData.grid) return initialData.grid;
        return createInitialGrid();
    });
    const [isMinusRows, setIsMinusRows] = useState(() => initialData.isMinusRows || Array(ROW_COUNT).fill(false));
    const [hasMinus, setHasMinus] = useState(() => initialData.hasMinus !== undefined ? initialData.hasMinus : false);
    const [complementStatus, setComplementStatus] = useState(() => initialData.complementStatus !== undefined ? initialData.complementStatus : false);
    const [minDigit, setMinDigit] = useState(() => initialData.minDigit || 5);
    const [maxDigit, setMaxDigit] = useState(() => initialData.maxDigit || 12);
    const [targetTotalDigits, setTargetTotalDigits] = useState(() => initialData.targetTotalDigits || 130);
    const [rowCount, setRowCount] = useState(() => initialData.rowCount || 20);

    const [isGenerating, setIsGenerating] = useState(false);

    // --- 各種作問条件 ---
    const [plusOneDigit, setPlusOneDigit] = useState(() => initialData.plusOneDigit ?? null);
    const [minusOneDigit, setMinusOneDigit] = useState(() => initialData.minusOneDigit ?? null);
    const [enclosedDigit, setEnclosedDigit] = useState(() => initialData.enclosedDigit ?? null);
    const [sandwichedDigit, setSandwichedDigit] = useState(() => initialData.sandwichedDigit ?? null);
    const [consecutiveDigit, setConsecutiveDigit] = useState(() => initialData.consecutiveDigit ?? null);

    const [firstRowFirstDigit, setFirstRowMin] = useState(() => initialData.firstRowFirstDigit ?? null);
    const [firstRowLastDigit, setFirstRowMax] = useState(() => initialData.firstRowLastDigit ?? null);
    const [lastRowFirstDigit, setLastRowMin] = useState(() => initialData.lastRowFirstDigit ?? null);
    const [lastRowLastDigit, setLastRowMax] = useState(() => initialData.lastRowLastDigit ?? null);
    const [answerFirstDigit, setAnswerMin] = useState(() => initialData.answerFirstDigit ?? null);
    const [answerLastDigit, setAnswerMax] = useState(() => initialData.answerLastDigit ?? null);

    // --- 現在の状態のスナップショット（保存用） ---
    const currentState = useMemo(() => ({
        grid, isMinusRows, hasMinus, complementStatus, minDigit, maxDigit, targetTotalDigits, rowCount,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit
    }), [
        grid, isMinusRows, hasMinus, complementStatus, minDigit, maxDigit, targetTotalDigits, rowCount,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit
    ]);

    // --- 操作用関数 ---
    
    // セルの値を更新
    const updateDigit = useCallback((rowIndex, colIndex, value) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            newGrid[rowIndex][colIndex] = value;
            return newGrid;
        });
    }, []);

    // 行のマイナス（引き算）を切り替え
    const toggleRowMinus = useCallback((rowIndex) => {
        setIsMinusRows(prev => {
            const next = [...prev];
            next[rowIndex] = !next[rowIndex];
            return next;
        });
    }, []);

    // 行の桁数を変更し、ランダムな数字で埋める
    const updateRowDigitCount = useCallback((rowIndex, length) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            newGrid[rowIndex] = generateRandomRow(length);
            return newGrid;
        });
    }, []);

    // --- 統計情報の計算 ---
    const stats = useMemo(() => {
        return calculateProblemStats(grid, isMinusRows, rowCount, targetTotalDigits, {
            plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
            firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit
        });
    }, [grid, isMinusRows, rowCount, targetTotalDigits,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit
    ]);

    // --- ランダム問題の生成 ---
    const generateRandomGrid = useCallback(() => {
        setIsGenerating(true);
        setTimeout(() => {
            const { grid: newGrid, isMinusRows: newMinusRows } = generateProblemGrid({
                rowCount, minDigit, maxDigit, targetTotalDigits, hasMinus, complementStatus,
                conditions: {
                    firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit,
                    plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit
                }
            });
            setGrid(newGrid);
            setIsMinusRows(newMinusRows);
            setIsGenerating(false);
        }, 50); // UIにローディングを表示するための遅延
    }, [rowCount, minDigit, maxDigit, targetTotalDigits, hasMinus, complementStatus,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit
    ]);

    // --- CSVなどからの状態インポート ---
    const importState = useCallback((newState) => {
        if (newState.grid) setGrid(newState.grid);
        if (newState.isMinusRows) setIsMinusRows(newState.isMinusRows);
        if (newState.rowCount !== undefined) setRowCount(newState.rowCount);
        if (newState.minDigit !== undefined) setMinDigit(newState.minDigit);
        if (newState.maxDigit !== undefined) setMaxDigit(newState.maxDigit);
        if (newState.targetTotalDigits !== undefined) setTargetTotalDigits(newState.targetTotalDigits);
        if (newState.hasMinus !== undefined) setHasMinus(newState.hasMinus);
        if (newState.complementStatus !== undefined) setComplementStatus(newState.complementStatus);

        if (newState.plusOneDigit !== undefined) setPlusOneDigit(newState.plusOneDigit);
        if (newState.minusOneDigit !== undefined) setMinusOneDigit(newState.minusOneDigit);
        if (newState.enclosedDigit !== undefined) setEnclosedDigit(newState.enclosedDigit);
        if (newState.sandwichedDigit !== undefined) setSandwichedDigit(newState.sandwichedDigit);
        if (newState.consecutiveDigit !== undefined) setConsecutiveDigit(newState.consecutiveDigit);

        if (newState.firstRowFirstDigit !== undefined) setFirstRowMin(newState.firstRowFirstDigit);
        if (newState.firstRowLastDigit !== undefined) setFirstRowMax(newState.firstRowLastDigit);
        if (newState.lastRowFirstDigit !== undefined) setLastRowMin(newState.lastRowFirstDigit);
        if (newState.lastRowLastDigit !== undefined) setLastRowMax(newState.lastRowLastDigit);
        if (newState.answerFirstDigit !== undefined) setAnswerMin(newState.answerFirstDigit);
        if (newState.answerLastDigit !== undefined) setAnswerMax(newState.answerLastDigit);
    }, []);

    return {
        // State
        grid, minDigit, maxDigit, targetTotalDigits, rowCount, isMinusRows, isGenerating,
        hasMinus, complementStatus,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit,
        
        // Stats (export calculated stats. Note: complementStatus above overrides stats.complementStatus in naming,
        // but since we want the configured status to reflect, we export the configured one.
        // We can expose the calculated one if needed, but they should match after generation.)
        totalSum: stats.totalSum,
        frequency: stats.frequency,
        totalFrequency: stats.totalFrequency,
        frequencyDiffs: stats.frequencyDiffs,
        consecutive: stats.consecutive,
        rowDigitCounts: stats.rowDigitCounts,
        totalRowDigits: stats.totalRowDigits,
        calculatedComplementStatus: stats.complementStatus, // Just in case we need the calculated one
        isEnclosedUsed: stats.isEnclosedUsed,
        isSandwichedUsed: stats.isSandwichedUsed,
        isConsecutiveUsed: stats.isConsecutiveUsed,
        isFirstMinValid: stats.isFirstMinValid,
        isFirstMaxValid: stats.isFirstMaxValid,
        isLastMinValid: stats.isLastMinValid,
        isLastMaxValid: stats.isLastMaxValid,
        isAnsMinValid: stats.isAnsMinValid,
        isAnsMaxValid: stats.isAnsMaxValid,
        
        // Snapshot
        currentState,
        
        // Actions
        toggleRowMinus, updateDigit, updateRowDigitCount, generateRandomGrid, importState,
        setMinDigit, setMaxDigit, setTargetTotalDigits, setRowCount, setHasMinus, setComplementStatus,
        setPlusOneDigit, setMinusOneDigit, setEnclosedDigit, setSandwichedDigit, setConsecutiveDigit,
        setFirstRowMin, setFirstRowMax, setLastRowMin, setLastRowMax, setAnswerMin, setAnswerMax
    };
};

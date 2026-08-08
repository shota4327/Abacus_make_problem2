/**
 * @file useProblemState.ts
 * @description 単一の見取り算問題の状態（盤面グリッド、桁数設定、作問制約条件など）および編集・自動生成・統計計算の操作を提供するカスタムフックです。
 */

import { useState, useMemo, useCallback } from 'react';
import { createInitialGrid, ROW_COUNT } from '../constants/initialState';
import { calculateProblemStats } from '../utils/problemValidator';
import { generateProblemGrid, generateRandomRow } from '../utils/problemGenerator';
import { Grid, ProblemState } from '../types';

/**
 * 見取り算問題の編集・生成・統計計算状態を紐付けるカスタムフック
 * 
 * @param initialData - 問題の初期設定データ
 * @returns 状態値、統計情報、操作ハンドラー群を含むオブジェクト
 */
export const useProblemState = (initialData: Partial<ProblemState> = {}) => {
    // --- 状態の初期化 ---
    /** 20行×13列の数値セルグリッド状態 */
    const [grid, setGrid] = useState<Grid>(() => {
        if (initialData.grid) return initialData.grid;
        return createInitialGrid();
    });
    /** 各行がマイナス（引き算）かどうかのブーリアン配列 */
    const [isMinusRows, setIsMinusRows] = useState<boolean[]>(() => initialData.isMinusRows || Array(ROW_COUNT).fill(false));
    /** マイナス口を含むかどうかの設定 */
    const [hasMinus, setHasMinus] = useState<boolean>(() => initialData.hasMinus !== undefined ? initialData.hasMinus : false);
    /** 補数計算（5の補数・10の補数）を含むかどうかの設定 */
    const [complementStatus, setComplementStatus] = useState<boolean>(() => initialData.complementStatus !== undefined ? initialData.complementStatus : false);
    /** 1口あたりの最小桁数 */
    const [minDigit, setMinDigit] = useState<number>(() => initialData.minDigit || 5);
    /** 1口あたりの最大桁数 */
    const [maxDigit, setMaxDigit] = useState<number>(() => initialData.maxDigit || 12);
    /** 問題全体の目標合計桁数 */
    const [targetTotalDigits, setTargetTotalDigits] = useState<number>(() => initialData.targetTotalDigits || 130);
    /** 有効な行数（口数） */
    const [rowCount, setRowCount] = useState<number>(() => initialData.rowCount || 20);

    /** 問題の自動生成中（非同期処理中）のローディング状態 */
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // --- 各種作問条件 ---
    /** 出現回数を1回増やす指定の数字 (0-9またはnull) */
    const [plusOneDigit, setPlusOneDigit] = useState<number | null>(() => initialData.plusOneDigit ?? null);
    /** 出現回数を1回減らす指定の数字 (0-9またはnull) */
    const [minusOneDigit, setMinusOneDigit] = useState<number | null>(() => initialData.minusOneDigit ?? null);
    /** 包み（両隣が指定数字）の指定数字 (0-9またはnull) */
    const [enclosedDigit, setEnclosedDigit] = useState<number | null>(() => initialData.enclosedDigit ?? null);
    /** 挟み（指定数字で挟まれる）の指定数字 (0-9またはnull) */
    const [sandwichedDigit, setSandwichedDigit] = useState<number | null>(() => initialData.sandwichedDigit ?? null);
    /** 連続（同じ数字が2回続く）の指定数字 (0-9またはnull) */
    const [consecutiveDigit, setConsecutiveDigit] = useState<number | null>(() => initialData.consecutiveDigit ?? null);

    /** 1口目の先頭桁（最上位）の固定値 */
    const [firstRowFirstDigit, setFirstRowMin] = useState<number | null>(() => initialData.firstRowFirstDigit ?? null);
    /** 1口目の末尾桁（最下位）の固定値 */
    const [firstRowLastDigit, setFirstRowMax] = useState<number | null>(() => initialData.firstRowLastDigit ?? null);
    /** 最終口の先頭桁（最上位）の固定値 */
    const [lastRowFirstDigit, setLastRowMin] = useState<number | null>(() => initialData.lastRowFirstDigit ?? null);
    /** 最終口の末尾桁（最下位）の固定値 */
    const [lastRowLastDigit, setLastRowMax] = useState<number | null>(() => initialData.lastRowLastDigit ?? null);
    /** 答えの先頭桁（最上位）の固定値 */
    const [answerFirstDigit, setAnswerMin] = useState<number | null>(() => initialData.answerFirstDigit ?? null);
    /** 答えの末尾桁（最下位）の固定値 */
    const [answerLastDigit, setAnswerMax] = useState<number | null>(() => initialData.answerLastDigit ?? null);

    // --- 統計情報の計算 ---
    /** 盤面と設定の変更に応じて自動計算される問題の統計・判定結果 */
    const stats = useMemo(() => {
        return calculateProblemStats(grid, isMinusRows, rowCount, targetTotalDigits, {
            plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
            firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit
        });
    }, [grid, isMinusRows, rowCount, targetTotalDigits,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit
    ]);

    // --- 現在の状態のスナップショット（外部保存・条件マネージャー同期用） ---
    const currentState: ProblemState = useMemo(() => ({
        grid, isMinusRows, isMinusAllowed: hasMinus, hasMinus, complementStatus, minDigit, maxDigit, targetTotalDigits, rowCount,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit,
        isEnclosedUsed: stats ? stats.isEnclosedUsed : true,
        isSandwichedUsed: stats ? stats.isSandwichedUsed : true,
        isConsecutiveUsed: stats ? stats.isConsecutiveUsed : true,
        isFirstMinValid: stats ? stats.isFirstMinValid : true,
        isFirstMaxValid: stats ? stats.isFirstMaxValid : true,
        isLastMinValid: stats ? stats.isLastMinValid : true,
        isLastMaxValid: stats ? stats.isLastMaxValid : true,
        isAnsMinValid: stats ? stats.isAnsMinValid : true,
        isAnsMaxValid: stats ? stats.isAnsMaxValid : true
    }), [
        grid, isMinusRows, hasMinus, complementStatus, minDigit, maxDigit, targetTotalDigits, rowCount,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit,
        stats
    ]);

    // --- 操作用関数 ---
    
    /**
     * 指定セルの数字を更新します。
     * @param rowIndex - 行インデックス (0-19)
     * @param colIndex - 列インデックス (0-12)
     * @param value - 設定する値 (0-9 または null)
     */
    const updateDigit = useCallback((rowIndex: number, colIndex: number, value: number | null) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            if (newGrid[rowIndex]) {
                newGrid[rowIndex][colIndex] = value;
            }
            return newGrid;
        });
    }, []);

    /**
     * 指定した行のマイナス（引き算）状態をトグル反転します。
     * @param rowIndex - 対象の行インデックス
     */
    const toggleRowMinus = useCallback((rowIndex: number) => {
        setIsMinusRows(prev => {
            const next = [...prev];
            next[rowIndex] = !next[rowIndex];
            return next;
        });
    }, []);

    /**
     * 指定行の桁数を変更し、ランダムな数字で置き換えます。
     * @param rowIndex - 対象の行インデックス
     * @param length - 新しい桁数
     */
    const updateRowDigitCount = useCallback((rowIndex: number, length: number) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            newGrid[rowIndex] = generateRandomRow(length);
            return newGrid;
        });
    }, []);

    /**
     * 設定条件を満たす見取り算問題を全自動生成します。
     */
    const generateRandomGrid = useCallback(() => {
        setIsGenerating(true);
        requestAnimationFrame(() => {
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
            }, 0);
        });
    }, [rowCount, minDigit, maxDigit, targetTotalDigits, hasMinus, complementStatus,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit
    ]);

    /**
     * 外部オブジェクトから問題状態を一括インポートします。
     * @param newState - インポート元の状態データ
     */
    const importState = useCallback((newState: Partial<ProblemState>) => {
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
        
        // Stats（計算結果）
        totalSum: stats.totalSum,
        frequency: stats.frequency,
        totalFrequency: stats.totalFrequency,
        frequencyDiffs: stats.frequencyDiffs,
        consecutive: stats.consecutive,
        rowDigitCounts: stats.rowDigitCounts,
        totalRowDigits: stats.totalRowDigits,
        calculatedComplementStatus: stats.complementStatus,
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

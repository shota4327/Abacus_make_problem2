/**
 * @file useMultiplicationState.ts
 * @description 掛け算問題(10問分)の状態管理、桁/小数点編集、個別/一括問題生成、および統計計算の機能を提供するカスタムフックです。
 */

import { useState, useMemo, useCallback } from 'react';
import { generateMultiplicationProblems, regenerateMultiplicationRow } from '../utils/multiplicationGenerator';
import { calculateMultiplicationStats } from '../utils/multiplicationValidator';
import { createInitialMultiplicationState } from '../constants/initialState';
import { MultiplicationProblemState } from '../types';

/**
 * 掛け算問題群（10問）の状態と操作関数群を提供するカスタムフック
 * 
 * @returns 状態、操作ハンドラー、集計統計オブジェクト
 */
export const useMultiplicationState = () => {
    /** 10問分の掛け算問題状態配列 */
    const [problems, setProblems] = useState<MultiplicationProblemState[]>(() =>
        Array(10).fill(null).map(() => createInitialMultiplicationState())
    );
    /** 一括自動生成中のローディング状態 */
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    /**
     * 特定の問題の特定辺（left/right）の特定の桁に数字を設定・変更します。
     * 
     * @param problemIndex - 問題番号のインデックス (0-9)
     * @param side - 左辺（被乗数）か右辺（乗数）か
     * @param digitIndex - 桁のインデックス (0-6)
     * @param value - 設定する値 (0-9 または null)
     */
    const updateDigit = useCallback((problemIndex: number, side: 'left' | 'right', digitIndex: number, value: number | null) => {
        setProblems(prev => {
            const next = [...prev];
            const target = next[problemIndex];
            if (target) {
                const updatedSide = [...target[side]];
                updatedSide[digitIndex] = value;
                next[problemIndex] = {
                    ...target,
                    [side]: updatedSide
                };
            }
            return next;
        });
    }, []);

    /**
     * 特定の問題の特定辺（left/right）の小数点位置を設定または解除（トグル）します。
     * 
     * @param problemIndex - 問題番号のインデックス (0-9)
     * @param side - 左辺か右辺か
     * @param digitIndex - 小数点を設置する桁インデックス (0-6)
     */
    const toggleDecimal = useCallback((problemIndex: number, side: 'left' | 'right', digitIndex: number) => {
        setProblems(prev => {
            const next = [...prev];
            const target = next[problemIndex];
            if (target) {
                const decimalKey = side === 'left' ? 'decimalLeft' : 'decimalRight';
                const currentDecimal = target[decimalKey];
                const newDecimal = currentDecimal === digitIndex ? null : digitIndex;

                next[problemIndex] = {
                    ...target,
                    [decimalKey]: newDecimal
                };
            }
            return next;
        });
    }, []);

    /**
     * 1つの問題の片辺（左辺または右辺）を指定した桁数でランダムに再生成します。
     * 
     * @param problemIndex - 問題番号のインデックス (0-9)
     * @param side - 左辺か右辺か
     * @param length - 再生成する桁数
     */
    const regenerateRow = useCallback((problemIndex: number, side: 'left' | 'right', length: number) => {
        setProblems(prev => {
            const next = [...prev];
            const target = next[problemIndex];
            if (target) {
                next[problemIndex] = regenerateMultiplicationRow(target, side, length);
            }
            return next;
        });
    }, []);

    /**
     * 10問すべての掛け算問題を一括でランダム自動生成します。
     */
    const generateRandomProblems = useCallback(() => {
        setIsGenerating(true);
        requestAnimationFrame(() => {
            setTimeout(() => {
                const newProblems = generateMultiplicationProblems();
                setProblems(newProblems);
                setIsGenerating(false);
            }, 0);
        });
    }, []);

    /** 10問分の全問題の統計情報（数字出現頻度、積の桁数、難易度等）を自動計算 */
    const stats = useMemo(() => calculateMultiplicationStats(problems), [problems]);

    return {
        problems,
        updateDigit,
        toggleDecimal,
        regenerateRow,
        generateRandomProblems,
        replaceProblems: setProblems,
        isGenerating,
        
        // 計算された統計情報をスプレッド展開して返却
        ...stats 
    };
};

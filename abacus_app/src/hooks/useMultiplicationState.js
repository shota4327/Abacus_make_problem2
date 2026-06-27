import { useState, useMemo, useCallback } from 'react';
import { generateMultiplicationProblems, regenerateMultiplicationRow } from '../utils/multiplicationGenerator';
import { calculateMultiplicationStats } from '../utils/multiplicationValidator';
import { createInitialMultiplicationState } from '../constants/initialState';

export const useMultiplicationState = () => {
    // 10問分の状態を初期化
    const [problems, setProblems] = useState(() =>
        Array(10).fill(null).map(() => createInitialMultiplicationState())
    );

    // 特定の問題の、特定の桁の数字を更新
    const updateDigit = useCallback((problemIndex, side, digitIndex, value) => {
        setProblems(prev => {
            const next = [...prev];
            // 状態を直接変更しないようにディープコピー
            next[problemIndex] = {
                ...next[problemIndex],
                [side]: [...next[problemIndex][side]]
            };
            next[problemIndex][side][digitIndex] = value;
            return next;
        });
    }, []);

    // 小数点の位置を切り替え
    const toggleDecimal = useCallback((problemIndex, side, digitIndex) => {
        setProblems(prev => {
            const next = [...prev];
            const currentDecimal = next[problemIndex][side === 'left' ? 'decimalLeft' : 'decimalRight'];
            // すでに小数点がある場所をクリックした場合は解除(null)、それ以外は設定
            const newDecimal = currentDecimal === digitIndex ? null : digitIndex;

            next[problemIndex] = {
                ...next[problemIndex],
                [side === 'left' ? 'decimalLeft' : 'decimalRight']: newDecimal
            };
            return next;
        });
    }, []);

    // 1つの問題の片辺（左辺または右辺）だけを再生成
    const regenerateRow = useCallback((problemIndex, side, length) => {
        setProblems(prev => {
            const next = [...prev];
            next[problemIndex] = regenerateMultiplicationRow(next[problemIndex], side, length);
            return next;
        });
    }, []);

    // 10問すべてを一括でランダム生成
    const generateRandomProblems = useCallback(() => {
        const newProblems = generateMultiplicationProblems();
        setProblems(newProblems);
    }, []);

    // 現在の問題（problems）に基づき統計情報を計算
    const stats = useMemo(() => calculateMultiplicationStats(problems), [problems]);

    return {
        problems,
        updateDigit,
        toggleDecimal,
        regenerateRow,
        generateRandomProblems,
        replaceProblems: setProblems,
        
        // 統計情報をそのまま展開して返す
        ...stats 
    };
};

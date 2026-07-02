import { useState, useMemo, useCallback } from 'react';
import { regenerateDivisionRow } from '../utils/divisionGenerator';
import { calculateDivisionStats } from '../utils/divisionValidator';
import { createInitialDivisionState } from '../constants/initialState';

export const useDivisionState = () => {
    // 10問分の状態を初期化
    const [problems, setProblems] = useState(() =>
        Array(10).fill(null).map(() => createInitialDivisionState())
    );
    const [isGenerating, setIsGenerating] = useState(false);

    // 特定の問題の、特定の桁の数字を更新
    const updateDigit = useCallback((problemIndex, field, digitIndex, value) => {
        setProblems(prev => {
            const next = [...prev];
            // 状態を直接変更しないようにディープコピー
            next[problemIndex] = {
                ...next[problemIndex],
                [field]: [...next[problemIndex][field]]
            };
            next[problemIndex][field][digitIndex] = value;
            return next;
        });
    }, []);

    // 小数点の位置を切り替え
    const toggleDecimal = useCallback((problemIndex, field, digitIndex) => {
        setProblems(prev => {
            const next = [...prev];
            const decimalKey = 'decimal' + field.charAt(0).toUpperCase() + field.slice(1);
            const currentDecimal = next[problemIndex][decimalKey];
            // すでに小数点がある場所をクリックした場合は解除(null)、それ以外は設定
            const newDecimal = currentDecimal === digitIndex ? null : digitIndex;

            next[problemIndex] = {
                ...next[problemIndex],
                [decimalKey]: newDecimal
            };
            return next;
        });
    }, []);

    // 1つの問題の1つの項目（割られる数、割る数、答えのいずれか）だけを再生成
    const regenerateRow = useCallback((problemIndex, field, length) => {
        setProblems(prev => {
            const next = [...prev];
            next[problemIndex] = regenerateDivisionRow(next[problemIndex], field, length);
            return next;
        });
    }, []);

    // 10問すべてを一括でランダム生成 (Web Workerを使用してバックグラウンド実行)
    const generateRandomProblems = useCallback(() => {
        if (isGenerating) return; // 既に生成中の場合は何もしない
        setIsGenerating(true);
        
        const worker = new Worker(new URL('../workers/divisionWorker.js', import.meta.url), { type: 'module' });
        
        worker.onmessage = (e) => {
            if (e.data.type === 'SUCCESS') {
                setProblems(e.data.payload);
            } else if (e.data.type === 'ERROR') {
                console.error('Worker error:', e.data.payload);
            }
            setIsGenerating(false);
            worker.terminate();
        };

        worker.onerror = (err) => {
            console.error('Worker failed:', err);
            setIsGenerating(false);
            worker.terminate();
        };

        worker.postMessage({ type: 'GENERATE' });
    }, [isGenerating]);

    // 現在の問題（problems）に基づき統計情報を計算
    const stats = useMemo(() => calculateDivisionStats(problems), [problems]);

    return {
        problems,
        updateDigit,
        toggleDecimal,
        regenerateRow,
        generateRandomProblems,
        replaceProblems: setProblems,
        isGenerating,
        
        // 統計情報をそのまま展開して返す
        ...stats 
    };
};

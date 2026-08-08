/**
 * @file useDivisionState.ts
 * @description 割り算問題(10問分)の状態管理、桁/小数点編集、Web Workerを用いた非同期一括生成、および統計計算機能を提供するカスタムフックです。
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { regenerateDivisionRow } from '../utils/divisionGenerator';
import { calculateDivisionStats } from '../utils/divisionValidator';
import { createInitialDivisionState } from '../constants/initialState';
import { DivisionProblemState, WorkerResponse } from '../types';
import DivisionWorker from '../workers/divisionWorker.ts?worker&inline';

/**
 * 割り算問題群（10問）の状態と操作関数群を提供するカスタムフック
 * 
 * @returns 状態、編集用ハンドラー、Web Worker自動生成関数、集計統計オブジェクト
 */
export const useDivisionState = () => {
    /** 10問分の割り算問題状態配列 */
    const [problems, setProblems] = useState<DivisionProblemState[]>(() =>
        Array(10).fill(null).map(() => createInitialDivisionState())
    );
    /** バックグラウンドWeb Workerによる自動生成中のローディング状態 */
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    /** 現在のWorkerの参照を保持（アンマウント時およびタイムアウト時のクリーンアップ用） */
    const workerRef = useRef<Worker | null>(null);

    // コンポーネントのアンマウント時にWorkerを停止
    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    /**
     * 特定の問題の指定フィールド（dividend:割られる数 / divisor:割る数 / answer:商）の特定桁の数字を変更します。
     * 
     * @param problemIndex - 問題番号のインデックス (0-9)
     * @param field - フィールド種別
     * @param digitIndex - 桁インデックス
     * @param value - 設定する値 (0-9 または null)
     */
    const updateDigit = useCallback((
        problemIndex: number,
        field: 'dividend' | 'divisor' | 'answer',
        digitIndex: number,
        value: number | null
    ) => {
        setProblems(prev => {
            const next = [...prev];
            const target = next[problemIndex];
            if (target) {
                const updatedField = [...target[field]];
                updatedField[digitIndex] = value;
                next[problemIndex] = {
                    ...target,
                    [field]: updatedField
                };
            }
            return next;
        });
    }, []);

    /**
     * 特定の割り算問題・フィールドの小数点位置を設定または解除（トグル）します。
     * 
     * @param problemIndex - 問題番号のインデックス (0-9)
     * @param field - フィールド種別
     * @param digitIndex - 小数点を設置する桁インデックス
     */
    const toggleDecimal = useCallback((
        problemIndex: number,
        field: 'dividend' | 'divisor' | 'answer',
        digitIndex: number
    ) => {
        setProblems(prev => {
            const next = [...prev];
            const target = next[problemIndex];
            if (target) {
                const decimalKey = ('decimal' + field.charAt(0).toUpperCase() + field.slice(1)) as keyof DivisionProblemState;
                const currentDecimal = target[decimalKey] as number | null;
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
     * 1つの問題の1項目（割られる数・割る数・商のいずれか）を指定桁数でランダム再生成します。
     * 
     * @param problemIndex - 問題番号のインデックス (0-9)
     * @param field - フィールド種別
     * @param length - 再生成する桁数
     */
    const regenerateRow = useCallback((
        problemIndex: number,
        field: 'dividend' | 'divisor' | 'answer',
        length: number
    ) => {
        setProblems(prev => {
            const next = [...prev];
            const target = next[problemIndex];
            if (target && field !== 'dividend') {
                next[problemIndex] = regenerateDivisionRow(target, field, length);
            }
            return next;
        });
    }, []);

    /**
     * Web Worker（divisionWorker）を使用して10問の割り算問題をバックグラウンドで全自動生成します。
     * UIの描画が停止・フリーズするのを防ぐ非同期設計です。
     */
    const generateRandomProblems = useCallback(() => {
        if (isGenerating) return; // 二重実行防止
        setIsGenerating(true);
        
        // 前回のWorkerが残っていれば停止
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        // インラインWeb Workerをインスタンス化
        const worker = new DivisionWorker();
        workerRef.current = worker;
        
        // 30秒でタイムアウト
        const timeoutId = setTimeout(() => {
            console.warn('割り算問題の生成がタイムアウトしました（30秒）');
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            setIsGenerating(false);
        }, 30000);

        // メッセージ受信（生成完了・エラー）のハンドラ設定
        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            clearTimeout(timeoutId);
            if (e.data.type === 'SUCCESS') {
                setProblems(e.data.payload);
            } else if (e.data.type === 'ERROR') {
                console.error('Worker error:', e.data.payload);
            }
            setIsGenerating(false);
            worker.terminate();
            workerRef.current = null;
        };

        worker.onerror = (err) => {
            clearTimeout(timeoutId);
            console.error('Worker failed:', err);
            setIsGenerating(false);
            worker.terminate();
            workerRef.current = null;
        };

        // Workerへ生成リクエスト送信
        worker.postMessage({ type: 'GENERATE' });
    }, [isGenerating]);

    /** 10問分の割り算問題の統計情報（数字出現頻度、還元商/確信商等の解法難易度統計）の自動計算 */
    const stats = useMemo(() => calculateDivisionStats(problems), [problems]);

    return {
        problems,
        updateDigit,
        toggleDecimal,
        regenerateRow,
        generateRandomProblems,
        replaceProblems: setProblems,
        isGenerating,
        
        // 統計情報をスプレッド展開して返却
        ...stats 
    };
};

/**
 * @file divisionWorker.ts
 * @description 割り算問題生成処理をメインスレッドのUI描画をブロックせず非同期でバックグラウンド実行するためのWeb Workerです。
 */

import { generateDivisionProblems } from '../utils/divisionGenerator';
import { WorkerRequest, WorkerResponse } from '../types';

// Web Worker スコープの型付け
const ctx: Worker = self as unknown as Worker;

ctx.onerror = function(error: ErrorEvent | string) {
    const message = typeof error === 'string' ? error : (error?.message || 'Worker内で不明なエラーが発生しました');
    const stack = typeof error === 'string' ? null : (error?.error?.stack || null);
    const response: WorkerResponse = {
        type: 'ERROR',
        payload: {
            message,
            stack
        }
    };
    ctx.postMessage(response);
};

ctx.onmessage = function(e: MessageEvent<WorkerRequest>) {
    if (e.data && e.data.type === 'GENERATE') {
        try {
            // 重いバックグラウンド生成処理（割り算問題10件分）を実行
            const newProblems = generateDivisionProblems();
            
            // 生成成功メッセージと生成結果をメインスレッドへ返信
            const response: WorkerResponse = {
                type: 'SUCCESS',
                payload: newProblems
            };
            ctx.postMessage(response);
        } catch (error) {
            // 例外発生時はエラーメッセージとスタックトレースをメインスレッドへ送信
            const err = error as Error;
            const response: WorkerResponse = {
                type: 'ERROR',
                payload: {
                    message: err.message || 'Unknown error occurred in divisionWorker',
                    stack: err.stack || null
                }
            };
            ctx.postMessage(response);
        }
    }
};

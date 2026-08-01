/**
 * @file divisionWorker.js
 * @description 割り算問題生成処理をメインスレッドのUI描画をブロックせず非同期でバックグラウンド実行するためのWeb Workerです。
 */

import { generateDivisionProblems } from '../utils/divisionGenerator.js';

/**
 * メインスレッドからのメッセージを受信し、割り算問題の自動生成を実行します。
 * 
 * @param {MessageEvent} e - メインスレッドから送信されたメッセージイベント
 * @param {Object} e.data - イベントデータ
 * @param {string} e.data.type - リクエストタイプ ('GENERATE')
 */
self.onerror = function(error) {
    self.postMessage({
        type: 'ERROR',
        payload: {
            message: typeof error === 'string' ? error : (error?.message || 'Worker内で不明なエラーが発生しました'),
            stack: error?.stack || null
        }
    });
};
self.onmessage = function(e) {
    if (e.data.type === 'GENERATE') {
        try {
            // 重いバックグラウンド生成処理（割り算問題10件分）を実行
            const newProblems = generateDivisionProblems();
            
            // 生成成功メッセージと生成結果をメインスレッドへ返信
            self.postMessage({
                type: 'SUCCESS',
                payload: newProblems
            });
        } catch (error) {
            // 例外発生時はエラーメッセージとスタックトレースをメインスレッドへ送信
            self.postMessage({
                type: 'ERROR',
                payload: {
                    message: error.message || 'Unknown error occurred in divisionWorker',
                    stack: error.stack
                }
            });
        }
    }
};


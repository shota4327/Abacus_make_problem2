import { generateDivisionProblems } from '../utils/divisionGenerator.js';

// Workerからのメッセージ受信リスナー
self.onmessage = function(e) {
    if (e.data.type === 'GENERATE') {
        try {
            // 時間のかかる処理を実行
            const newProblems = generateDivisionProblems();
            
            // 処理が完了したらメインスレッドに結果を送信
            self.postMessage({
                type: 'SUCCESS',
                payload: newProblems
            });
        } catch (error) {
            // エラーが発生した場合はメインスレッドにエラーを送信
            self.postMessage({
                type: 'ERROR',
                payload: error.message || 'Unknown error occurred in divisionWorker'
            });
        }
    }
};

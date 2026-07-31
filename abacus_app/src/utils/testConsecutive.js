/**
 * @file testConsecutive.js
 * @description 連続文字（例: 0-0, 0-1）の検出ロジック動作を検証するための簡易テストスクリプトです。
 */

import { calculateMultiplicationStats } from './multiplicationValidator.js';

// テスト用データ1（小数点以下0.123）
const p1 = {
    left: [null, null, 1, 2, 3, 4, 5],
    right: [null, null, null, 0, 1, 2, 3], // 0.123
    decimalRight: 3
};

// テスト用データ2（先頭ゼロを含む 0.0123）
const p2 = {
    left: [null, null, 1, 2, 3, 4, 5],
    right: [null, null, 0, 0, 1, 2, 3], // 0.0123
    decimalRight: 3
};

const problems = [p1, p2];

// 統計情報計算と連続桁検出結果のログ出力
const stats = calculateMultiplicationStats(problems);
console.log("Consecutive 0-0:", stats.consecutive[0][0]);
console.log("Consecutive 0-1:", stats.consecutive[0][1]);


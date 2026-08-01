/**
 * @file ConsecutiveCounter.jsx
 * @description 2桁の連続する数字ペア（1文字目 -> 2文字目の遷移）の出現頻度マトリクス（10x10のグリッド表）を表示し、連続桁や過多な出現（3回以上）を警告描画するコンポーネントです。
 */

import React from 'react';
import './Stats.css';

/**
 * 連続文字（ペア数値遷移）出現マトリクス表示コンポーネント
 * 
 * @param {Object} props
 * @param {Array<Array<number>>} props.consecutive - 10x10の連続数値出現頻度マトリクス [d1][d2]
 * @returns {JSX.Element} 連続文字マトリクスUI
 */
const ConsecutiveCounter = ({ consecutive }) => {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="panel stats-panel">
            <h2>連続文字</h2>
            <div className="consecutive-wrapper">
                {/* Y軸ラベル（2文字目） */}
                <div className="vertical-label-container">
                    <span className="axis-label vertical-text">２文字目</span>
                </div>
                <div className="table-content-vertical">
                    {/* X軸ラベル（1文字目） */}
                    <div className="horizontal-label-container">
                        <span className="axis-label">１文字目</span>
                    </div>
                    {/* 10x10 マトリクステーブル */}
                    <div className="frequency-table-container">
                        <table className="frequency-table consecutive-table">
                            <thead>
                                <tr>
                                    <th className="corner" style={{ width: '32px' }}></th>
                                    {digits.map(d1 => (
                                        <th key={`h-${d1}`}>{d1}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {digits.map(d2 => (
                                    <tr key={`r-${d2}`}>
                                        <th className="row-label">{d2}</th>
                                        {digits.map(d1 => {
                                            const count = consecutive?.[d1]?.[d2] ?? 0;
                                            return (
                                                <td
                                                    key={`${d1}-${d2}`}
                                                    // 3回以上の過多ペアは'warn'(赤)、同一数字の連続(例:5-5)は'highlight-orange'スタイルを適用
                                                    className={`${count >= 3 ? 'warn' : ''} ${d1 === d2 ? 'highlight-orange' : ''}`}
                                                >
                                                    {count > 0 ? count : ''}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsecutiveCounter;


import React, { useState } from 'react';
import './DigitManager.css';
import { useProblemState } from '../hooks/useProblemState.js'; // Ensure correct path if needed, but props should be passed from App usually.

// Accepting generateRandomGrid as prop from App to avoid double hook instantiation if context isn't used.
const DigitManager = ({ generateRandomGrid }) => {
    const [minDigits, setMinDigits] = useState(3);
    const [maxDigits, setMaxDigits] = useState(5);

    const handleApply = () => {
        if (generateRandomGrid) {
            generateRandomGrid(Number(minDigits), Number(maxDigits));
        }
    };

    return (
        <div className="panel digit-panel">
            <h2>桁数管理</h2>
            <div className="control-group">
                <label>ベース (最小)</label>
                <input
                    type="number"
                    min="1"
                    max="12"
                    value={minDigits}
                    onChange={(e) => setMinDigits(e.target.value)}
                />
            </div>
            <div className="control-group">
                <label>最大桁数</label>
                <input
                    type="number"
                    min="1"
                    max="12"
                    value={maxDigits}
                    onChange={(e) => setMaxDigits(e.target.value)}
                />
            </div>
            <div className="info">
                差: {maxDigits - minDigits} 桁
            </div>
            <button className="generate-btn" onClick={handleApply}>
                再生成
            </button>
        </div>
    );
};

export default DigitManager;

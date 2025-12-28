import React from 'react';
import './Stats.css';

const ConsecutiveCounter = ({ consecutive }) => {
    return (
        <div className="panel stats-panel">
            <h2>連続文字</h2>
            <div className="consecutive-list">
                {consecutive.map((row, currentNum) =>
                    row.map((count, nextNum) => {
                        if (count === 0) return null;
                        return (
                            <div key={`${currentNum}-${nextNum}`} className="stat-row compact">
                                <span className="stat-label">{currentNum}→{nextNum}:</span>
                                <span className={`stat-value ${count >= 3 ? 'warn' : ''}`}>
                                    {count}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ConsecutiveCounter;

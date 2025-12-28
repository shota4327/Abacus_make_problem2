import React from 'react';
import './Stats.css';

const ConsecutiveCounter = ({ consecutive }) => {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="panel stats-panel">
            <h2>連続文字</h2>
            <div className="consecutive-wrapper">
                <div className="vertical-label-container">
                    <span className="axis-label vertical-text">２文字目</span>
                </div>
                <div className="table-content-vertical">
                    <div className="horizontal-label-container">
                        <span className="axis-label">１文字目</span>
                    </div>
                    <div className="frequency-table-container">
                        <table className="frequency-table consecutive-table">
                            <thead>
                                <tr>
                                    <th className="corner"></th>
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
                                            const count = consecutive[d1][d2];
                                            return (
                                                <td
                                                    key={`${d1}-${d2}`}
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

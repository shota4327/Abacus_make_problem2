import React from 'react';
import './Stats.css';

const ConsecutiveCounter = ({ consecutive }) => {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="panel stats-panel">
            <h2>連続文字</h2>
            <div className="frequency-table-container">
                <table className="frequency-table">
                    <thead>
                        <tr>
                            <th></th>
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
                                        <td key={`${d1}-${d2}`} className={count >= 3 ? 'warn' : ''}>
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
    );
};

export default ConsecutiveCounter;

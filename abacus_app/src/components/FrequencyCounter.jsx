import React from 'react';
import './Stats.css';

const FrequencyCounter = ({ frequency, totalFrequency, frequencyDiffs }) => {
    return (
        <div className="panel stats-panel">
            <h2>出現回数</h2>
            <div className="frequency-table-container">
                <table className="frequency-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <th key={num} className={num % 2 !== 0 ? 'highlight-orange-light' : ''}>{num}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {frequency.map((rowFreq, rowIndex) => (
                            <tr key={rowIndex}>
                                <td className="row-label">{rowIndex + 1}</td>
                                {rowFreq.map((count, num) => (
                                    <td key={num} className={`${count >= 3 ? 'warn' : ''} ${num % 2 !== 0 ? 'highlight-orange-light' : ''}`}>
                                        {count > 0 ? count : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row">
                            <td className="row-label">合計</td>
                            {totalFrequency?.map((count, num) => (
                                <td key={num} className={num % 2 !== 0 ? 'highlight-orange-light' : ''}>
                                    {count}
                                </td>
                            ))}
                        </tr>
                        <tr className="diff-row">
                            <td className="row-label">過不足</td>
                            {frequencyDiffs?.map((diff, num) => (
                                <td key={num} className={`${num % 2 !== 0 ? 'highlight-orange-light' : ''} ${diff > 0 ? 'pos' : diff < 0 ? 'neg' : ''}`}>
                                    {diff > 0 ? `+${diff}` : diff}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default FrequencyCounter;

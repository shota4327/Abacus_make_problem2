import React, { useState } from 'react';
import './ConditionManager.css';

const ConditionManager = ({ problems, onUpdate }) => {
    // Active selector state: { problemIndex, key } | null
    const [activeSelector, setActiveSelector] = useState(null);

    const lengths = [5, 6, 7, 8, 9, 10, 11, 12];
    const totalOptions = [120, 130, 140];
    const rowOptions = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const digitOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Configuration for each row
    const rows = [
        { label: '総字数', key: 'targetTotalDigits', options: totalOptions },
        { label: '口数', key: 'rowCount', options: rowOptions },
        { label: '最小桁数', key: 'minDigit', options: lengths, limitKey: 'maxDigit', limitType: 'min' },
        { label: '最大桁数', key: 'maxDigit', options: lengths, limitKey: 'minDigit', limitType: 'max' },
        { label: '＋１文字', key: 'plusOneDigit', options: digitOptions, isNullable: true },
        { label: '－１文字', key: 'minusOneDigit', options: digitOptions, isNullable: true },
        { label: '囲み文字', key: 'enclosedDigit', options: digitOptions, isNullable: true, warnKey: 'isEnclosedUsed' },
        { label: 'はさまれ', key: 'sandwichedDigit', options: digitOptions, isNullable: true, warnKey: 'isSandwichedUsed' },
        { label: '連続文字', key: 'consecutiveDigit', options: digitOptions, isNullable: true, warnKey: 'isConsecutiveUsed' },
        { label: '1口目(先頭)', key: 'firstRowMin', options: digitOptions, isNullable: true, noZero: true, warnKey: 'isFirstMinValid' },
        { label: '1口目(末尾)', key: 'firstRowMax', options: digitOptions, isNullable: true, warnKey: 'isFirstMaxValid' },
        { label: '最終口(先頭)', key: 'lastRowMin', options: digitOptions, isNullable: true, noZero: true, warnKey: 'isLastMinValid' },
        { label: '最終口(末尾)', key: 'lastRowMax', options: digitOptions, isNullable: true, warnKey: 'isLastMaxValid' },
        { label: '答え(先頭)', key: 'answerMin', options: digitOptions, isNullable: true, noZero: true, warnKey: 'isAnsMinValid' },
        { label: '答え(末尾)', key: 'answerMax', options: digitOptions, isNullable: true, warnKey: 'isAnsMaxValid' },
        { label: 'マイナス', key: 'hasMinus', readOnly: true, format: val => val ? 'あり' : 'なし' },
        { label: '補数計算', key: 'complementStatus', readOnly: true },
    ];

    const handleSelect = (problemIndex, key, val, config) => {
        const problemState = problems[problemIndex];
        let finalVal = val;

        if (val === 'R') {
            const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
            let opts = config.options;
            if (config.noZero) {
                opts = opts.filter(d => d !== 0);
            }
            finalVal = getRandom(opts);
        }

        // Handle Range Constraints (Min/Max Digit)
        if (config.limitType === 'min') {
            // setting min, ensure <= max
            const maxVal = problemState[config.limitKey];
            finalVal = Math.min(finalVal, maxVal);
        } else if (config.limitType === 'max') {
            // setting max, ensure >= min
            const minVal = problemState[config.limitKey];
            finalVal = Math.max(finalVal, minVal);
        }

        const newState = { ...problemState, [key]: finalVal };
        onUpdate(problemIndex, newState);
        setActiveSelector(null);
    };

    return (
        <div className="condition-manager-container">
            <h2 className="manager-title">作問条件一覧</h2>
            <div className="table-wrapper">
                <table className="condition-table">
                    <thead>
                        <tr>
                            <th className="label-col">項目</th>
                            {problems.map((_, i) => (
                                <th key={i} className="problem-col-header">
                                    第{i + 1}問
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((rowConfig, rowIndex) => (
                            <tr key={rowConfig.key}>
                                <td className="label-col">{rowConfig.label}</td>
                                {problems.map((problemState, pIndex) => {
                                    const rawVal = problemState[rowConfig.key];
                                    const currentVal = rowConfig.format ? rowConfig.format(rawVal) : rawVal;

                                    if (rowConfig.readOnly) {
                                        return (
                                            <td key={pIndex} className="cell-wrapper">
                                                <div className="cell-container readonly">
                                                    <span className="readonly-text">
                                                        {currentVal || (rowConfig.key === 'complementStatus' ? 'なし' : '-')}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    }

                                    const isActive = activeSelector?.problemIndex === pIndex && activeSelector?.key === rowConfig.key;

                                    // Validation check for warning style
                                    // Note: Validation flags (isEnclosedUsed etc.) are calculated in useProblemState based on the grid.
                                    // If we are just editing logic here, those flags might be stale or not present if useProblemState isn't running for this problem?
                                    // Wait, useProblemState calculates stats each render. But in App.jsx, we only run ONE useProblemState at a time for the active tab.
                                    // For inactive tabs, 'problems' array just holds the data object (snapshot).
                                    // The data object returned by currentState DOES contain the validation flags (e.g. isEnclosedUsed).
                                    // So we can fallback to reading them from problemState.
                                    const isWarn = rowConfig.warnKey && problemState[rowConfig.warnKey] === false;
                                    const isBottomRow = rowIndex >= rows.length - 6; // Last 6 rows pop up

                                    return (
                                        <td key={pIndex} className="cell-wrapper">
                                            <div className="cell-container">
                                                <button
                                                    className={`cell-btn ${isActive ? 'active' : ''} ${isWarn ? 'warn' : ''}`}
                                                    onClick={() => setActiveSelector(isActive ? null : { problemIndex: pIndex, key: rowConfig.key })}
                                                >
                                                    {currentVal === null ? '-' : currentVal}
                                                </button>
                                                {isActive && (
                                                    <>
                                                        <div className="fixed-backdrop" onClick={() => setActiveSelector(null)} />
                                                        <div className={`cell-popover ${isBottomRow ? 'pop-up' : ''}`}>
                                                            {rowConfig.isNullable && (
                                                                <button onClick={() => handleSelect(pIndex, rowConfig.key, null, rowConfig)}>-</button>
                                                            )}
                                                            <button className="random-btn" onClick={() => handleSelect(pIndex, rowConfig.key, 'R', rowConfig)}>R</button>
                                                            {rowConfig.options
                                                                .filter(opt => !(opt === 0 && rowConfig.noZero))
                                                                .map(opt => (
                                                                    <button key={opt} onClick={() => handleSelect(pIndex, rowConfig.key, opt, rowConfig)}>
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
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

export default ConditionManager;

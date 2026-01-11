/* eslint-disable react-hooks/purity */
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
        {
            label: '桁数',
            type: 'range',
            key: 'digits',
            minConfig: { key: 'minDigit', options: lengths, limitKey: 'maxDigit', limitType: 'min' },
            maxConfig: { key: 'maxDigit', options: lengths, limitKey: 'minDigit', limitType: 'max' }
        },
        { label: '＋１文字', key: 'plusOneDigit', options: digitOptions, isNullable: true },
        { label: '－１文字', key: 'minusOneDigit', options: digitOptions, isNullable: true },
        { label: '囲み文字', key: 'enclosedDigit', options: digitOptions, isNullable: true, warnKey: 'isEnclosedUsed' },
        { label: 'はさまれ文字', key: 'sandwichedDigit', options: digitOptions, isNullable: true, warnKey: 'isSandwichedUsed' },
        { label: '連続文字', key: 'consecutiveDigit', options: digitOptions, isNullable: true, warnKey: 'isConsecutiveUsed' },
        {
            label: '1口目',
            type: 'range',
            key: 'firstRow',
            minConfig: { key: 'firstRowMin', options: digitOptions, isNullable: true, noZero: true, warnKey: 'isFirstMinValid' },
            maxConfig: { key: 'firstRowMax', options: digitOptions, isNullable: true, warnKey: 'isFirstMaxValid' }
        },
        {
            label: '最終口',
            type: 'range',
            key: 'lastRow',
            minConfig: { key: 'lastRowMin', options: digitOptions, isNullable: true, noZero: true, warnKey: 'isLastMinValid' },
            maxConfig: { key: 'lastRowMax', options: digitOptions, isNullable: true, warnKey: 'isLastMaxValid' }
        },
        {
            label: '答え',
            type: 'range',
            key: 'answer',
            minConfig: { key: 'answerMin', options: digitOptions, isNullable: true, noZero: true, warnKey: 'isAnsMinValid' },
            maxConfig: { key: 'answerMax', options: digitOptions, isNullable: true, warnKey: 'isAnsMaxValid' }
        },
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

    const handleRandomRow = (rowConfig) => {
        // Logic specific to each row type requested
        if (rowConfig.key === 'targetTotalDigits') {
            // 120 and 140: 1 or 2 each (balanced). Rest 130.
            const count = Math.random() < 0.5 ? 1 : 2;
            const count120 = count;
            const count140 = count;
            const count130 = 10 - count120 - count140;

            const values = [
                ...Array(count120).fill(120),
                ...Array(count140).fill(140),
                ...Array(count130).fill(130)
            ];

            // Shuffle
            for (let i = values.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [values[i], values[j]] = [values[j], values[i]];
            }

            problems.forEach((p, i) => {
                onUpdate(i, { ...p, targetTotalDigits: values[i] });
            });
        }
        else if (rowConfig.key === 'rowCount') {
            // Random 10-20. Must include at least one 20.
            const opts = rowConfig.options; // 10..20
            const values = Array(10).fill(0).map(() => opts[Math.floor(Math.random() * opts.length)]);

            if (!values.includes(20)) {
                values[Math.floor(Math.random() * 10)] = 20;
            }

            problems.forEach((p, i) => {
                onUpdate(i, { ...p, rowCount: values[i] });
            });
        }
        else if (rowConfig.key === 'digits') { // Range row for digits
            // Min/Max from lengths [5..12]. Min <= Max.
            // Constraint: maxDigit >= targetTotalDigits / rowCount
            const opts = rowConfig.minConfig.options;

            problems.forEach((p, i) => {
                const avg = p.targetTotalDigits / p.rowCount;
                const minAllowedMax = Math.ceil(avg);
                const maxAllowedMin = Math.floor(avg);

                let validMaxOpts = opts.filter(o => o >= minAllowedMax);
                if (validMaxOpts.length === 0) validMaxOpts = [Math.max(...opts)];

                let validMinOpts = opts.filter(o => o <= maxAllowedMin);
                if (validMinOpts.length === 0) validMinOpts = [Math.min(...opts)];

                const valMaxCandidate = validMaxOpts[Math.floor(Math.random() * validMaxOpts.length)];
                const valMinCandidate = validMinOpts[Math.floor(Math.random() * validMinOpts.length)];

                onUpdate(i, {
                    ...p,
                    minDigit: Math.min(valMinCandidate, valMaxCandidate),
                    maxDigit: Math.max(valMinCandidate, valMaxCandidate)
                });
            });
        }
        else if (['plusOneDigit', 'minusOneDigit', 'enclosedDigit', 'sandwichedDigit', 'consecutiveDigit'].includes(rowConfig.key)) {
            // 0-9 random PERMUTATION for the 10 problems.
            // Constraints: must not match pair value.

            let excludeKeys = [];
            if (rowConfig.key === 'plusOneDigit') excludeKeys = ['minusOneDigit'];
            else if (rowConfig.key === 'minusOneDigit') excludeKeys = ['plusOneDigit'];
            else if (rowConfig.key === 'enclosedDigit') excludeKeys = ['sandwichedDigit', 'consecutiveDigit'];
            else if (rowConfig.key === 'sandwichedDigit') excludeKeys = ['enclosedDigit', 'consecutiveDigit'];
            else if (rowConfig.key === 'consecutiveDigit') excludeKeys = ['enclosedDigit', 'sandwichedDigit'];

            // Get current values of pair/group to avoid collisions
            // excludeValsPerProblem[i] is an array of values to avoid for problem i
            const excludeValsPerProblem = problems.map(p => excludeKeys.map(k => p[k]));

            const baseValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            let bestValues = [...baseValues];
            let minConflicts = 11;

            // Try to find a permutation with 0 conflicts
            for (let attempt = 0; attempt < 100; attempt++) {
                // Shuffle
                const current = [...baseValues];
                for (let i = current.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [current[i], current[j]] = [current[j], current[i]];
                }

                // Check conflicts
                let conflicts = 0;
                if (excludeKeys.length > 0) {
                    for (let i = 0; i < problems.length; i++) {
                        if (i < current.length && excludeValsPerProblem[i].includes(current[i])) {
                            conflicts++;
                        }
                    }
                }

                if (conflicts === 0) {
                    bestValues = current;
                    minConflicts = 0;
                    break;
                }

                if (conflicts < minConflicts) {
                    minConflicts = conflicts;
                    bestValues = current;
                }
            }

            problems.forEach((p, i) => {
                if (i < bestValues.length) {
                    onUpdate(i, { ...p, [rowConfig.key]: bestValues[i] });
                }
            });
        }
        else if (['firstRow', 'lastRow', 'answer'].includes(rowConfig.key)) {
            // Left (Min): 1-9 + 1 duplicate (total 10).
            // Right (Max): 0-9 (total 10).

            const baseMin = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const invalidVar = baseMin[Math.floor(Math.random() * baseMin.length)];
            const minValues = [...baseMin, invalidVar]; // naming variable 'invalidVar' is unintentional, using 'extra' logic

            // Shuffle Min
            for (let i = minValues.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [minValues[i], minValues[j]] = [minValues[j], minValues[i]];
            }

            const maxValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            // Shuffle Max
            for (let i = maxValues.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [maxValues[i], maxValues[j]] = [maxValues[j], maxValues[i]];
            }

            problems.forEach((p, i) => {
                onUpdate(i, {
                    ...p,
                    [rowConfig.minConfig.key]: minValues[i],
                    [rowConfig.maxConfig.key]: maxValues[i]
                });
            });
        }
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
                            <th className="random-col-header">ランダム</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((rowConfig, rowIndex) => (
                            <tr key={rowConfig.key}>
                                <td className="label-col">{rowConfig.label}</td>
                                {problems.map((problemState, pIndex) => {
                                    const isBottomRow = rowIndex >= rows.length - 3; // Adjusted for shorter list

                                    if (rowConfig.readOnly) {
                                        const rawVal = problemState[rowConfig.key];
                                        const currentVal = rowConfig.format ? rowConfig.format(rawVal) : rawVal;
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

                                    if (rowConfig.type === 'range') {
                                        const minConf = rowConfig.minConfig;
                                        const maxConf = rowConfig.maxConfig;
                                        const minVal = problemState[minConf.key];
                                        const maxVal = problemState[maxConf.key];

                                        const isMinActive = activeSelector?.problemIndex === pIndex && activeSelector?.key === minConf.key;
                                        const isMaxActive = activeSelector?.problemIndex === pIndex && activeSelector?.key === maxConf.key;

                                        const isMinWarn = minConf.warnKey && problemState[minConf.warnKey] === false;
                                        const isMaxWarn = maxConf.warnKey && problemState[maxConf.warnKey] === false;

                                        return (
                                            <td key={pIndex} className="cell-wrapper">
                                                <div className="cell-container range-container">
                                                    {/* Min Button */}
                                                    <div className="range-part">
                                                        <button
                                                            className={`cell-btn half ${isMinActive ? 'active' : ''} ${isMinWarn ? 'warn' : ''}`}
                                                            onClick={() => setActiveSelector(isMinActive ? null : { problemIndex: pIndex, key: minConf.key })}
                                                        >
                                                            {minVal === null ? '-' : minVal}
                                                        </button>
                                                        {isMinActive && (
                                                            <>
                                                                <div className="fixed-backdrop" onClick={() => setActiveSelector(null)} />
                                                                <div className={`cell-popover ${isBottomRow ? 'pop-up' : ''}`}>
                                                                    {minConf.isNullable && (
                                                                        <button onClick={() => handleSelect(pIndex, minConf.key, null, minConf)}>-</button>
                                                                    )}
                                                                    <button className="random-btn" onClick={() => handleSelect(pIndex, minConf.key, 'R', minConf)}>R</button>
                                                                    {minConf.options
                                                                        .filter(opt => !(opt === 0 && minConf.noZero))
                                                                        .map(opt => (
                                                                            <button key={opt} onClick={() => handleSelect(pIndex, minConf.key, opt, minConf)}>
                                                                                {opt}
                                                                            </button>
                                                                        ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    <span className="range-separator">ー</span>

                                                    {/* Max Button */}
                                                    <div className="range-part">
                                                        <button
                                                            className={`cell-btn half ${isMaxActive ? 'active' : ''} ${isMaxWarn ? 'warn' : ''}`}
                                                            onClick={() => setActiveSelector(isMaxActive ? null : { problemIndex: pIndex, key: maxConf.key })}
                                                        >
                                                            {maxVal === null ? '-' : maxVal}
                                                        </button>
                                                        {isMaxActive && (
                                                            <>
                                                                <div className="fixed-backdrop" onClick={() => setActiveSelector(null)} />
                                                                <div className={`cell-popover ${isBottomRow ? 'pop-up' : ''}`}>
                                                                    {maxConf.isNullable && (
                                                                        <button onClick={() => handleSelect(pIndex, maxConf.key, null, maxConf)}>-</button>
                                                                    )}
                                                                    <button className="random-btn" onClick={() => handleSelect(pIndex, maxConf.key, 'R', maxConf)}>R</button>
                                                                    {maxConf.options
                                                                        .filter(opt => !(opt === 0 && maxConf.noZero))
                                                                        .map(opt => (
                                                                            <button key={opt} onClick={() => handleSelect(pIndex, maxConf.key, opt, maxConf)}>
                                                                                {opt}
                                                                            </button>
                                                                        ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    }

                                    // Standard Row
                                    const currentVal = problemState[rowConfig.key];
                                    const isActive = activeSelector?.problemIndex === pIndex && activeSelector?.key === rowConfig.key;
                                    const isWarn = rowConfig.warnKey && problemState[rowConfig.warnKey] === false;

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
                                {/* Random Column Cell */}
                                <td className="cell-wrapper random-col">
                                    {!rowConfig.readOnly && (
                                        <div className="cell-container">
                                            <button
                                                className="cell-btn random-row-btn"
                                                onClick={() => handleRandomRow(rowConfig)}
                                            >
                                                R
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConditionManager;

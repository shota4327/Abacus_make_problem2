/* eslint-disable react-hooks/purity */
import React, { useState } from 'react';
import { generateProblemGrid } from '../utils/problemGenerator';
import './ConditionManager.css';

const ConditionManager = ({ problems, onUpdate }) => {
    // Active selector state: { problemIndex, key } | null
    const [activeSelector, setActiveSelector] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

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
            minConfig: { key: 'firstRowFirstDigit', options: digitOptions, isNullable: true, noZero: true, warnKey: 'isFirstMinValid' },
            maxConfig: { key: 'firstRowLastDigit', options: digitOptions, isNullable: true, warnKey: 'isFirstMaxValid' }
        },
        {
            label: '最終口',
            type: 'range',
            key: 'lastRow',
            minConfig: { key: 'lastRowFirstDigit', options: digitOptions, isNullable: true, noZero: true, warnKey: 'isLastMinValid' },
            maxConfig: { key: 'lastRowLastDigit', options: digitOptions, isNullable: true, warnKey: 'isLastMaxValid' }
        },
        {
            label: '答え',
            type: 'range',
            key: 'answer',
            minConfig: { key: 'answerFirstDigit', options: digitOptions, isNullable: true, noZero: true, warnKey: 'isAnsMinValid' },
            maxConfig: { key: 'answerLastDigit', options: digitOptions, isNullable: true, warnKey: 'isAnsMaxValid' }
        },
        { label: 'マイナス', key: 'hasMinus', type: 'toggle', format: val => val ? 'あり' : 'なし', warnKey: 'isMinusValid' },
        { label: '補数計算', key: 'complementStatus', type: 'toggle', format: val => val ? '補数計算あり' : 'なし', warnKey: 'isComplementValid' },
    ];

    /**
     * セル内のポップオーバーから値が選択された時の処理
     */
    const handleSelect = (problemIndex, key, val, config) => {
        const problemState = problems[problemIndex];
        let finalVal = val;

        // 'R'（ランダム）が選ばれた場合
        if (val === 'R') {
            const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
            let opts = config.options;
            // ゼロを許容しない設定の場合は除外
            if (config.noZero) {
                opts = opts.filter(d => d !== 0);
            }
            finalVal = getRandom(opts);
        }

        // 範囲指定（最小・最大）の整合性チェック
        if (config.limitType === 'min') {
            // 最小値を設定する場合、最大値を超えないようにする
            const maxVal = problemState[config.limitKey];
            finalVal = Math.min(finalVal, maxVal);
        } else if (config.limitType === 'max') {
            // 最大値を設定する場合、最小値を下回らないようにする
            const minVal = problemState[config.limitKey];
            finalVal = Math.max(finalVal, minVal);
        }

        const newState = { ...problemState, [key]: finalVal };
        onUpdate(problemIndex, newState);
        setActiveSelector(null); // ポップオーバーを閉じる
    };

    const isCompatible = (tt, rc, minD, maxD) => {
        if (minD * rc > tt) return false;
        if (maxD * rc < tt) return false;
        if (minD === maxD && minD * rc !== tt) return false;
        return true;
    };

    /**
     * 各設定行の右端にある「R（ランダム）」ボタンが押された時の処理を
     * problems配列に対して適用し、新しい配列を返す
     */
    const applyRandomRow = (rowConfig, currentProblems) => {
        let newProblems = [...currentProblems];

        if (rowConfig.key === 'targetTotalDigits') {
            const count120 = Math.random() < 0.5 ? 1 : 2;
            const count140 = Math.random() < 0.5 ? 1 : 2;
            const count130 = 10 - count120 - count140;

            const values = [
                ...Array(count120).fill(120),
                ...Array(count140).fill(140),
                ...Array(count130).fill(130)
            ];

            for (let i = values.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [values[i], values[j]] = [values[j], values[i]];
            }

            newProblems = newProblems.map((p, i) => {
                let tt = values[i];
                if (isCompatible(tt, p.rowCount, p.minDigit, p.maxDigit)) {
                    return { ...p, targetTotalDigits: tt };
                }
                return p;
            });
        }
        else if (rowConfig.key === 'rowCount') {
            const opts = rowConfig.options.filter(o => o !== 20); 
            const num20 = Math.random() < 0.1 ? 2 : 1;
            
            let availableFor20 = [];
            for (let i = 0; i < 10; i++) {
                if (isCompatible(newProblems[i].targetTotalDigits, 20, newProblems[i].minDigit, newProblems[i].maxDigit)) {
                    availableFor20.push(i);
                }
            }
            for (let i = availableFor20.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableFor20[i], availableFor20[j]] = [availableFor20[j], availableFor20[i]];
            }
            let rowCount20Indices = availableFor20.slice(0, num20);

            newProblems = newProblems.map((p, i) => {
                let rc;
                if (rowCount20Indices.includes(i)) {
                    rc = 20;
                } else {
                    rc = opts[Math.floor(Math.random() * opts.length)];
                }
                if (isCompatible(p.targetTotalDigits, rc, p.minDigit, p.maxDigit)) {
                    return { ...p, rowCount: rc };
                }
                return p;
            });
        }
        else if (rowConfig.key === 'digits') { 
            const opts = rowConfig.minConfig.options;

            let availableForExact = [];
            for (let i = 0; i < 10; i++) {
                let p = newProblems[i];
                if (p.targetTotalDigits % p.rowCount === 0) {
                    let d = p.targetTotalDigits / p.rowCount;
                    if (opts.includes(d)) {
                        availableForExact.push(i);
                    }
                }
            }
            for (let i = availableForExact.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableForExact[i], availableForExact[j]] = [availableForExact[j], availableForExact[i]];
            }
            let exactIndex = availableForExact.length > 0 ? availableForExact[0] : -1;

            newProblems = newProblems.map((p, i) => {
                let minD, maxD;
                if (i === exactIndex) {
                    let d = p.targetTotalDigits / p.rowCount;
                    minD = d;
                    maxD = d;
                } else {
                    let d1 = opts[Math.floor(Math.random() * opts.length)];
                    let d2 = opts[Math.floor(Math.random() * opts.length)];
                    minD = Math.min(d1, d2);
                    maxD = Math.max(d1, d2);
                }

                if (isCompatible(p.targetTotalDigits, p.rowCount, minD, maxD)) {
                    return { ...p, minDigit: minD, maxDigit: maxD };
                }
                return p;
            });
        }
        else if (['plusOneDigit', 'minusOneDigit', 'enclosedDigit', 'sandwichedDigit', 'consecutiveDigit'].includes(rowConfig.key)) {
            let excludeKeys = [];
            if (rowConfig.key === 'plusOneDigit') excludeKeys = ['minusOneDigit'];
            else if (rowConfig.key === 'minusOneDigit') excludeKeys = ['plusOneDigit'];
            else if (rowConfig.key === 'enclosedDigit') excludeKeys = ['sandwichedDigit', 'consecutiveDigit'];
            else if (rowConfig.key === 'sandwichedDigit') excludeKeys = ['enclosedDigit', 'consecutiveDigit'];
            else if (rowConfig.key === 'consecutiveDigit') excludeKeys = ['enclosedDigit', 'sandwichedDigit'];

            const excludeValsPerProblem = newProblems.map(p => excludeKeys.map(k => p[k]));

            const baseValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            let bestValues = [...baseValues];
            let minConflicts = 11;

            for (let attempt = 0; attempt < 100; attempt++) {
                const current = [...baseValues];
                for (let i = current.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [current[i], current[j]] = [current[j], current[i]];
                }

                let conflicts = 0;
                if (excludeKeys.length > 0) {
                    for (let i = 0; i < newProblems.length; i++) {
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

            newProblems = newProblems.map((p, i) => {
                if (i < bestValues.length) {
                    return { ...p, [rowConfig.key]: bestValues[i] };
                }
                return p;
            });
        }
        else if (['firstRow', 'lastRow', 'answer'].includes(rowConfig.key)) {
            const baseMin = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const extraVar = baseMin[Math.floor(Math.random() * baseMin.length)];
            const minValues = [...baseMin, extraVar]; 

            for (let i = minValues.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [minValues[i], minValues[j]] = [minValues[j], minValues[i]];
            }

            const maxValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            for (let i = maxValues.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [maxValues[i], maxValues[j]] = [maxValues[j], maxValues[i]];
            }

            newProblems = newProblems.map((p, i) => ({
                ...p,
                [rowConfig.minConfig.key]: minValues[i],
                [rowConfig.maxConfig.key]: maxValues[i]
            }));
        }
        else if (rowConfig.key === 'hasMinus' || rowConfig.key === 'complementStatus') {
            const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            const minusIndices = indices.slice(0, 3); // 3問
            const complementIndex = minusIndices[Math.floor(Math.random() * minusIndices.length)]; // その中の1問

            const minusSet = new Set(minusIndices);

            newProblems = newProblems.map((p, i) => ({
                ...p, 
                hasMinus: minusSet.has(i),
                complementStatus: i === complementIndex
            }));
        }

        return newProblems;
    };

    /**
     * 個別行のランダムボタンが押された時の処理
     */
    const handleRandomRow = (rowConfig) => {
        const newProblems = applyRandomRow(rowConfig, problems);
        newProblems.forEach((p, i) => {
            onUpdate(i, p);
        });
    };

    /**
     * すべてのランダムボタンを一括で実行する処理
     */
    const handleAllRandom = () => {
        let currentProblems = [...problems];

        // --- ベース3項目（総字数、口数、桁数）を一括して矛盾なく生成する ---
        let success = false;
        let attempts = 0;
        const num20 = Math.random() < 0.1 ? 2 : 1;
        
        // rows から桁数のオプションを探す
        let digitsRow = rows.find(r => r.key === 'digits');
        const optsDigits = digitsRow ? digitsRow.minConfig.options : [5,6,7,8,9,10,11,12];

        while (!success && attempts < 1000) {
            attempts++;
            let tempProblems = currentProblems.map(p => ({...p}));
            
            const count120 = Math.random() < 0.5 ? 1 : 2;
            const count140 = Math.random() < 0.5 ? 1 : 2;
            const count130 = 10 - count120 - count140;
            let ttValues = [
                ...Array(count120).fill(120),
                ...Array(count140).fill(140),
                ...Array(count130).fill(130)
            ];
            for (let i = ttValues.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [ttValues[i], ttValues[j]] = [ttValues[j], ttValues[i]];
            }

            let indices = [0,1,2,3,4,5,6,7,8,9];
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            let rowCount20Indices = indices.slice(0, num20);
            let exactIndex = Math.floor(Math.random() * 10);

            let allOk = true;
            for (let i = 0; i < 10; i++) {
                let tt = ttValues[i];
                let rc = rowCount20Indices.includes(i) ? 20 : Math.floor(Math.random() * 10) + 10; // 10~19
                let minD, maxD;

                if (i === exactIndex) {
                    if (tt % rc === 0 && optsDigits.includes(tt / rc)) {
                        minD = maxD = tt / rc;
                    } else {
                        allOk = false;
                        break;
                    }
                } else {
                    let avg = tt / rc;
                    let allowedMins = optsDigits.filter(d => d <= Math.floor(avg));
                    let allowedMaxs = optsDigits.filter(d => d >= Math.ceil(avg));

                    if (allowedMins.length === 0 || allowedMaxs.length === 0) {
                        allOk = false;
                        break;
                    }

                    minD = allowedMins[Math.floor(Math.random() * allowedMins.length)];
                    maxD = allowedMaxs[Math.floor(Math.random() * allowedMaxs.length)];

                    if (minD === maxD) {
                        if (maxD < Math.max(...optsDigits)) maxD++;
                        else if (minD > Math.min(...optsDigits)) minD--;
                    }
                    if (!isCompatible(tt, rc, minD, maxD)) {
                        allOk = false;
                        break;
                    }
                }
                
                tempProblems[i].targetTotalDigits = tt;
                tempProblems[i].rowCount = rc;
                tempProblems[i].minDigit = minD;
                tempProblems[i].maxDigit = maxD;
            }

            if (allOk) {
                currentProblems = tempProblems;
                success = true;
            }
        }
        
        if (!success) {
            console.warn("Failed to generate combined base settings for ALL RANDOM.");
        }

        const seenKeys = new Set();
        seenKeys.add('targetTotalDigits');
        seenKeys.add('rowCount');
        seenKeys.add('digits');
        
        rows.forEach(rowConfig => {
            if (rowConfig.readOnly) return;
            
            let keyGroup = rowConfig.key;
            if (rowConfig.key === 'hasMinus' || rowConfig.key === 'complementStatus') {
                keyGroup = 'minus_group';
            }
            if (['firstRow', 'lastRow', 'answer'].includes(rowConfig.key)) {
                keyGroup = rowConfig.key; // これは独立して実行する
            }

            if (!seenKeys.has(keyGroup)) {
                seenKeys.add(keyGroup);
                currentProblems = applyRandomRow(rowConfig, currentProblems);
            }
        });

        // 最後に一括で onUpdate
        currentProblems.forEach((p, i) => {
            onUpdate(i, p);
        });
    };

    const handleRegenerateAll = () => {
        setIsGenerating(true);
        // UIブロックを避けるため非同期で実行
        setTimeout(() => {
            const newProblems = problems.map(p => {
                const { grid, isMinusRows } = generateProblemGrid({
                    rowCount: p.rowCount,
                    minDigit: p.minDigit,
                    maxDigit: p.maxDigit,
                    targetTotalDigits: p.targetTotalDigits,
                    hasMinus: p.hasMinus,
                    complementStatus: p.complementStatus,
                    conditions: {
                        firstRowFirstDigit: p.firstRowFirstDigit,
                        firstRowLastDigit: p.firstRowLastDigit,
                        lastRowFirstDigit: p.lastRowFirstDigit,
                        lastRowLastDigit: p.lastRowLastDigit,
                        answerFirstDigit: p.answerFirstDigit,
                        answerLastDigit: p.answerLastDigit,
                        plusOneDigit: p.plusOneDigit,
                        minusOneDigit: p.minusOneDigit,
                        enclosedDigit: p.enclosedDigit,
                        sandwichedDigit: p.sandwichedDigit,
                        consecutiveDigit: p.consecutiveDigit
                    }
                });
                return { ...p, grid, isMinusRows };
            });

            newProblems.forEach((p, i) => {
                onUpdate(i, p);
            });
            setIsGenerating(false);
        }, 50);
    };

    return (
        <div className="condition-manager-container">
            <div className="manager-header">
                <h2 className="manager-title">作問条件一覧</h2>
                <button className="all-regenerate-btn" onClick={handleRegenerateAll} disabled={isGenerating}>
                    すべて再生成
                </button>
                <button className="all-random-btn" onClick={handleAllRandom} disabled={isGenerating}>
                    すべてランダムに
                </button>
            </div>
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

                                    if (rowConfig.type === 'toggle') {
                                        const rawVal = problemState[rowConfig.key] || false;
                                        const currentVal = rowConfig.format ? rowConfig.format(rawVal) : rawVal;
                                        const isWarn = rowConfig.warnKey && problemState[rowConfig.warnKey] === false;
                                        
                                        return (
                                            <td key={pIndex} className="cell-wrapper">
                                                <div className="cell-container">
                                                    <button
                                                        className={`cell-btn wide-text ${isWarn ? 'warn' : ''}`}
                                                        onClick={() => {
                                                            const newVal = !rawVal;
                                                            let updates = { [rowConfig.key]: newVal };
                                                            // 補数計算をONにした場合は自動でマイナスもONにする
                                                            if (rowConfig.key === 'complementStatus' && newVal) {
                                                                updates.hasMinus = true;
                                                            }
                                                            // マイナスをOFFにした場合は自動で補数計算もOFFにする
                                                            if (rowConfig.key === 'hasMinus' && !newVal) {
                                                                updates.complementStatus = false;
                                                            }
                                                            onUpdate(pIndex, { ...problemState, ...updates });
                                                        }}
                                                    >
                                                        {currentVal}
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    }

                                    if (rowConfig.readOnly) {
                                        const rawVal = problemState[rowConfig.key];
                                        const currentVal = rowConfig.format ? rowConfig.format(rawVal) : rawVal;
                                        return (
                                            <td key={pIndex} className="cell-wrapper">
                                                <div className="cell-container readonly">
                                                    <span className="readonly-text">
                                                        {currentVal || '-'}
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
                                {rowConfig.key === 'hasMinus' ? (
                                    <td rowSpan={2} className="cell-wrapper random-col" style={{ verticalAlign: 'middle' }}>
                                        <div className="cell-container">
                                            <button
                                                className="cell-btn random-row-btn"
                                                onClick={() => handleRandomRow(rowConfig)}
                                            >
                                                R
                                            </button>
                                        </div>
                                    </td>
                                ) : rowConfig.key === 'complementStatus' ? null : (
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
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isGenerating && (
                <div className="loading-overlay">
                    <div className="loading-message">生成中...</div>
                </div>
            )}
        </div>
    );
};

export default ConditionManager;

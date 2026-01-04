
const ROW_COUNT = 20;
const COL_COUNT = 13;

export const createInitialGrid = () => {
    return Array(ROW_COUNT).fill(null).map(() => Array(COL_COUNT).fill(0));
};

export const createInitialProblemState = () => ({
    grid: createInitialGrid(),
    isMinusRows: Array(ROW_COUNT).fill(false),
    isMinusAllowed: false,
    minDigit: 5,
    maxDigit: 12,
    targetTotalDigits: 130,
    rowCount: 20,
    plusOneDigit: null,
    minusOneDigit: null,
    enclosedDigit: null,
    sandwichedDigit: null,
    consecutiveDigit: null,
    firstRowMin: null,
    firstRowMax: null,
    lastRowMin: null,
    lastRowMax: null,
    answerMin: null,
    answerMax: null,
    hasMinus: false,
    complementStatus: "なし"
});

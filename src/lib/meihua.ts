import { Lunar } from "lunar-javascript";

export type Trigram = {
    id: number;
    name: string;
    nature: string;
    wuxing: string; // Five Elements: 金, 木, 水, 火, 土
    lines: boolean[]; // [bottom, middle, top], true = Yang, false = Yin
};

export type Hexagram = {
    upper: Trigram;
    lower: Trigram;
    lines: boolean[]; // [bottom -> top] (6 lines)
};

export type DivinationResult = {
    main: Hexagram;
    mutual: Hexagram;
    changed: Hexagram;
    movingLine: number; // 1-6
    tiTrigram: Trigram; // Body/Subject
    yongTrigram: Trigram; // Function/Object
    tiWuxing: string;
    yongWuxing: string;
};

const TRIGRAMS: Record<number, Trigram> = {
    1: { id: 1, name: "乾", nature: "天", wuxing: "金", lines: [true, true, true] },
    2: { id: 2, name: "兑", nature: "泽", wuxing: "金", lines: [true, true, false] },
    3: { id: 3, name: "离", nature: "火", wuxing: "火", lines: [true, false, true] },
    4: { id: 4, name: "震", nature: "雷", wuxing: "木", lines: [true, false, false] },
    5: { id: 5, name: "巽", nature: "风", wuxing: "木", lines: [false, true, true] },
    6: { id: 6, name: "坎", nature: "水", wuxing: "水", lines: [false, true, false] },
    7: { id: 7, name: "艮", nature: "山", wuxing: "土", lines: [false, false, true] },
    8: { id: 8, name: "坤", nature: "地", wuxing: "土", lines: [false, false, false] },
};

function getTrigram(num: number): Trigram {
    const remainder = num % 8;
    return TRIGRAMS[remainder === 0 ? 8 : remainder];
}

function getHexagramLines(lower: Trigram, upper: Trigram): boolean[] {
    return [...lower.lines, ...upper.lines];
}

function getTrigramFromLines(lines: boolean[]): Trigram {
    // Simple matching based on lines
    const target = JSON.stringify(lines);
    for (const t of Object.values(TRIGRAMS)) {
        if (JSON.stringify(t.lines) === target) return t;
    }
    return TRIGRAMS[8]; // Fallback
}

export function calculateHexagrams(num1: number, num2: number, num3: number, movingLineIndex?: number): DivinationResult {
    // 1. Calculate Main Hexagram (本卦)
    const upperNum = num1;
    const lowerNum = num2;

    const upperTrigram = getTrigram(upperNum);
    const lowerTrigram = getTrigram(lowerNum);

    const mainLines = getHexagramLines(lowerTrigram, upperTrigram);
    const mainHexagram: Hexagram = {
        upper: upperTrigram,
        lower: lowerTrigram,
        lines: mainLines,
    };

    // 2. Calculate Moving Line (动爻)
    // If movingLineIndex is provided (e.g. from Time Divination), use it.
    // Otherwise fallback to classic number method: (num1 + num2 + num3) % 6
    let movingLine: number;
    if (movingLineIndex !== undefined) {
        movingLine = movingLineIndex;
    } else {
        const sum = num1 + num2 + num3;
        movingLine = sum % 6 === 0 ? 6 : sum % 6;
    }

    // 3. Calculate Changed Hexagram (变卦)
    const changedLines = [...mainLines];
    // movingLine is 1-based, array is 0-based
    changedLines[movingLine - 1] = !changedLines[movingLine - 1];

    const changedLowerLines = changedLines.slice(0, 3);
    const changedUpperLines = changedLines.slice(3, 6);

    const changedHexagram: Hexagram = {
        upper: getTrigramFromLines(changedUpperLines),
        lower: getTrigramFromLines(changedLowerLines),
        lines: changedLines,
    };

    // 4. Calculate Mutual Hexagram (互卦)
    // Lower mutual: lines 2,3,4 (indices 1,2,3)
    // Upper mutual: lines 3,4,5 (indices 2,3,4)
    const mutualLowerLines = [mainLines[1], mainLines[2], mainLines[3]];
    const mutualUpperLines = [mainLines[2], mainLines[3], mainLines[4]];

    const mutualHexagram: Hexagram = {
        upper: getTrigramFromLines(mutualUpperLines),
        lower: getTrigramFromLines(mutualLowerLines),
        lines: [...mutualLowerLines, ...mutualUpperLines],
    };

    // 5. Determine Ti (Body) and Yong (Function)
    // Moving line in lower trigram (1, 2, 3) -> Upper is Ti, Lower is Yong
    // Moving line in upper trigram (4, 5, 6) -> Lower is Ti, Upper is Yong
    let tiTrigram: Trigram;
    let yongTrigram: Trigram;

    if (movingLine <= 3) {
        tiTrigram = upperTrigram;
        yongTrigram = lowerTrigram;
    } else {
        tiTrigram = lowerTrigram;
        yongTrigram = upperTrigram;
    }

    return {
        main: mainHexagram,
        mutual: mutualHexagram,
        changed: changedHexagram,
        movingLine,
        tiTrigram,
        yongTrigram,
        tiWuxing: tiTrigram.wuxing,
        yongWuxing: yongTrigram.wuxing,
    };
}

export function generateTimeBasedNumbers(): { num1: number; num2: number; num3: number; movingLine: number } {
    const now = new Date();
    const lunar = Lunar.fromDate(now);

    // Traditional Meihua Yishu Time Method (Lunar):
    // Year: Earthly Branch Index (1-12) (Zi=1...Hai=12)
    // lunar.getYearZhiIndex() returns 0 for Zi, 11 for Hai. So add 1.
    const yearZhi = lunar.getYearZhiIndex() + 1;

    // Month: Lunar Month (1-12)
    const month = lunar.getMonth();

    // Day: Lunar Day (1-30)
    const day = lunar.getDay();

    // Hour: Earthly Branch Index (1-12) (Zi=1...Hai=12)
    // lunar.getTimeZhiIndex() returns 0 for Zi, 11 for Hai. So add 1.
    const timeZhi = lunar.getTimeZhiIndex() + 1;

    // Upper Trigram: (Year + Month + Day) % 8
    const num1 = yearZhi + month + day;

    // Lower Trigram: (Upper Sum + Time) % 8
    // Note: num2 here represents the sum "Years+Month+Day+Hour" effectively for the purpose of the modulo in calculation
    const num2 = num1 + timeZhi;

    // Moving Line: (Upper Sum + Time) % 6
    const totalSum = num1 + timeZhi;
    let movingLine = totalSum % 6;
    if (movingLine === 0) movingLine = 6;

    // num3 is returned as timeZhi just for display/reference, 
    // but the actual calculation should rely on the explicit 'movingLine' we return.
    return { num1, num2, num3: timeZhi, movingLine };
}

export function parseNumbersListFromString(input: string, min: number, max: number): number[] {
    if (input.trim().toLowerCase() === 'all') {
        return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    }

    const ranges = input.split(/,|;/);
    let numbers: number[] = [];

    for (const range of ranges) {
        if (range.includes('-')) {
            let [start, end] = range.split('-').map(Number);
            start = start !== undefined ? Math.max(start, min) : min;
            end = end !== undefined ? Math.min(end, max) : max;
            for (let i = start; i <= end; i++) {
                numbers.push(i);
            }
        } else if (range.trim().toLowerCase() === 'all') {
            numbers = numbers.concat(Array.from({ length: max - min + 1 }, (_, i) => i + min));
        } else {
            const number = Number(range);
            if (number >= min && number <= max) {
                numbers.push(number);
            }
        }
    }

    numbers = numbers.filter((number, index, self) => self.indexOf(number) === index && !isNaN(number));

    return numbers.sort((a, b) => a - b);
}

export function parseStartAndEndFromSingleOrRangeString(
    input: string,
    min: number,
    max: number
): { start: number; end: number } {
    input = input.trim().toLowerCase();

    if (input.includes('-')) {
        let [start, end] = input.split('-').map(Number);
        if (start && end) {
            start = Math.max(start, min);
            end = Math.min(end, max);
            return { start, end };
        }
    } else {
        const number = Number(input);
        if (!isNaN(number) && number >= min && number <= max) {
            return { start: number, end: number };
        }
    }

    return { start: 0, end: 0 };
}

export function numbersRangeToString(start: number, end: number, min: number, max: number): string {
    if (start === min && end === max) {
        return '';
    }

    if (start > end || start < min || end < min) {
        return '';
    }

    if (start === end) {
        return start.toString();
    }

    return `${start}-${end}`;
}

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

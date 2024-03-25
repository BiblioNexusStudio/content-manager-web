// eslint-disable-next-line
export function debounce<T extends (...args: any[]) => Promise<void>>(
    func: T,
    delay: number
): (...args: Parameters<T>) => Promise<void> {
    let timeoutId: NodeJS.Timeout | null = null;
    return async (...args: Parameters<T>) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        return new Promise<void>((resolve) => {
            timeoutId = setTimeout(async () => {
                await func(...args);
                resolve();
            }, delay);
        });
    };
}

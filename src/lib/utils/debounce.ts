export function debounce<T extends (...args: Parameters<T>) => Promise<void>>(
    func: T,
    delay: number
): (...args: Parameters<T>) => Promise<void> {
    let timeoutId: NodeJS.Timeout | null = null;
    const cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
    };

    const debounced = (...args: Parameters<T>) => {
        cancel();
        return new Promise<void>((resolve) => {
            timeoutId = setTimeout(async () => {
                await func(...args);
                resolve();
            }, delay);
        });
    };

    debounced.cancel = cancel;

    return debounced as T & { cancel: () => void };
}

export function enterKeyHandler(node: HTMLElement, handler: () => void): { destroy: () => void } {
    function handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            handler();
        }
    }

    node.addEventListener('keydown', handleKeyDown);

    return {
        destroy() {
            node.removeEventListener('keydown', handleKeyDown);
        },
    };
}

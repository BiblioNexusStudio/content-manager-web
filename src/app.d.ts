// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface Platform {}
    }

    declare interface Window {
        onInlineCommentClick: ((threadId: number, spanId: string) => void) | undefined;
        onBibleReferenceClick: ((spanId: string, startVerse: string, endVerse: string) => void) | undefined;
        clarity?: (
            action: 'identify',
            customId: string,
            customSessionId: string | undefined = undefined,
            customPageId: string | undefined = undefined,
            friendlyName: string | undefined = undefined
        ) => void;
    }
}

export {};

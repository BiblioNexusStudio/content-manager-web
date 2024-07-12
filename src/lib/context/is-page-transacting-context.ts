import { writable } from 'svelte/store';
import { getContext, setContext } from 'svelte';

const IS_PAGE_TRANSACTING_KEY = Symbol();

export function createIsPageTransactingContext() {
    const isPageTransacting = writable(false);
    setContext(IS_PAGE_TRANSACTING_KEY, isPageTransacting);
    return isPageTransacting;
}

export function getIsPageTransactingContext(): ReturnType<typeof createIsPageTransactingContext> {
    return getContext(IS_PAGE_TRANSACTING_KEY);
}

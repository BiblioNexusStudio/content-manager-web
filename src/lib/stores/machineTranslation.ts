import { type Writable, writable } from 'svelte/store';
import type { MachineTranslation } from '$lib/types/resources';
import { getContext, setContext } from 'svelte';

export type MachineTranslationStore = ReturnType<typeof createMachineTranslationStore>;

export function createMachineTranslationStore() {
    const machineTranslations: Writable<Map<number, MachineTranslation>> = writable(new Map());

    const promptForRating: Writable<boolean> = writable(false);

    let debounceTimeout: NodeJS.Timeout;
    const debounce = (callback: () => void) => {
        if (debounceTimeout) clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => callback(), 1000);
    };

    return {
        machineTranslations,
        promptForRating,
        debounce,
        resetStore: () => {
            machineTranslations.set(new Map());
            promptForRating.set(false);
        },
    };
}

const machineTranslationsKey = Symbol('machineTranslations');
export function setMachineTranslationContext(context: MachineTranslationStore) {
    setContext(machineTranslationsKey, context);
}

export function getMachineTranslationContext(): MachineTranslationStore {
    return getContext(machineTranslationsKey);
}

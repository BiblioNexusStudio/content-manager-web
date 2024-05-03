import { type Writable, writable } from 'svelte/store';
import type { MachineTranslation } from '$lib/types/resources';

export type MachineTranslationStore = ReturnType<typeof createMachineTranslationStore>;

export function createMachineTranslationStore() {
    const machineTranslation: Writable<MachineTranslation> = writable({
        id: 0,
        userId: 0,
        userRating: 0,
        improveClarity: false,
        improveConsistency: false,
        improveTone: false,
    });

    const promptForRating: Writable<boolean> = writable(false);

    let debounceTimeout: NodeJS.Timeout;
    const debounce = (callback: () => void) => {
        if (debounceTimeout) clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => callback(), 1000);
    };

    return {
        machineTranslation,
        promptForRating,
        debounce,
    };
}

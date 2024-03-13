import { writable, derived, type Readable, type Updater } from 'svelte/store';

interface ChangeTrackingStoreValue<T> {
    original: T;
    updated: T;
}

export interface ChangeTrackingStore<T> {
    subscribe: (run: (value: ChangeTrackingStoreValue<T>) => void) => () => void;
    hasChanges: Readable<boolean>;
    setOriginalOnly: (value: T) => void;
    setOriginalAndUpdated: (value: T) => void;
    setUpdated: (value: T) => void;
    resetToOriginal: () => void;
    updateOriginalAndUpdated: (updater: Updater<T>) => void;
    updateUpdated: (updater: Updater<T>) => void;
}

export default function createChangeTrackingStore<T>(
    initialValue: T,
    onChangeDebounced?: () => void,
    debounceDelay = 500
): ChangeTrackingStore<T> {
    const store = writable<ChangeTrackingStoreValue<T>>({ original: initialValue, updated: initialValue });

    const hasChanges = derived(store, ($store) => JSON.stringify($store.original) !== JSON.stringify($store.updated));

    let debounceTimeout: NodeJS.Timeout | null = null;

    function setOriginalOnly(value: T) {
        store.update(($store) => ({ ...$store, original: value }));
    }

    function setOriginalAndUpdated(value: T) {
        store.set({ original: value, updated: value });
    }

    function updateOriginalAndUpdated(updater: Updater<T>) {
        store.update(({ original, updated }) => ({ original: updater(original), updated: updater(updated) }));
    }

    function updateUpdated(updater: Updater<T>) {
        store.update(({ updated, ...rest }) => {
            handleDebounce();
            return { ...rest, updated: updater(updated) };
        });
    }

    function setUpdated(value: T) {
        store.update(($store) => {
            handleDebounce();
            return { ...$store, updated: value };
        });
    }

    function handleDebounce() {
        if (onChangeDebounced) {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }

            debounceTimeout = setTimeout(() => {
                onChangeDebounced();
            }, debounceDelay);
        }
    }
    function resetToOriginal() {
        store.update(($store) => ({ ...$store, updated: $store.original }));
    }

    return {
        subscribe: store.subscribe,
        hasChanges,
        setOriginalOnly,
        setOriginalAndUpdated,
        setUpdated,
        resetToOriginal,
        updateOriginalAndUpdated,
        updateUpdated,
    };
}

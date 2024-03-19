import { writable, derived, type Readable, type Updater } from 'svelte/store';

export interface ChangeTrackingStore<T> {
    subscribe: (run: (value: T) => void) => () => void;
    hasChanges: Readable<boolean>;
    setOriginalAndCurrent: (value: T) => void;
    setOriginalOnly: (value: T) => void;
    resetToOriginal: () => void;
    updateOriginalAndCurrent: (updater: Updater<T>) => void;
    update: (updater: Updater<T>) => void;
    set: (value: T) => void;
}

interface OnChangeOptions {
    onChange: () => void;
    debounceDelay: number;
}

interface StoreValue<T> {
    original: T;
    current: T;
}

export default function createChangeTrackingStore<T>(
    initialValue: T,
    onChangeOptions: OnChangeOptions | undefined = undefined
): ChangeTrackingStore<T> {
    const store = writable<StoreValue<T>>({
        original: JSON.parse(JSON.stringify(initialValue)),
        current: initialValue,
    });

    const hasChanges = derived(store, ($store) => jsonIsDifferent($store.original, $store.current));

    let debounceTimeout: NodeJS.Timeout | null = null;

    function setOriginalAndCurrent(value: T) {
        store.update(() => ({ original: JSON.parse(JSON.stringify(value)), current: value }));
    }

    function setOriginalOnly(value: T) {
        store.update(($store) => ({ ...$store, original: JSON.parse(JSON.stringify(value)) }));
    }

    function updateOriginalAndCurrent(updater: Updater<T>) {
        store.update(($store) => {
            const newValue = updater($store.current);
            return { original: JSON.parse(JSON.stringify(newValue)), current: newValue };
        });
    }

    function update(updater: Updater<T>) {
        store.update(($store) => {
            const newValue = updater($store.current);
            handleDebounce(jsonIsDifferent($store.original, newValue));
            return { ...$store, current: newValue };
        });
    }

    function handleDebounce(changeDetected: boolean) {
        if (onChangeOptions) {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }

            if (changeDetected) {
                debounceTimeout = setTimeout(() => {
                    onChangeOptions.onChange();
                }, onChangeOptions.debounceDelay);
            }
        }
    }

    function resetToOriginal() {
        store.update(($store) => ({ ...$store, current: $store.original }));
    }

    function set(value: T) {
        store.update(($store) => {
            handleDebounce(jsonIsDifferent($store.original, value));
            return { ...$store, current: value };
        });
    }

    return {
        subscribe: (run: (value: T) => void) => store.subscribe(($store) => run($store.current)),
        hasChanges,
        setOriginalAndCurrent,
        setOriginalOnly,
        resetToOriginal,
        updateOriginalAndCurrent,
        update,
        set,
    };
}

function jsonIsDifferent<T>(original: T, current: T) {
    return JSON.stringify(original) !== JSON.stringify(current);
}

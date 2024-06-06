import { writable, derived, type Readable, type Updater, get } from 'svelte/store';

export interface ChangeTrackingStore<T> {
    subscribe: (run: (value: T) => void) => () => void;
    hasChanges: Readable<boolean>;
    setOriginalAndCurrent: (value: T) => void;
    setOriginalOnly: (value: T) => void;
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

    const hasChanges = derived(store, ($store) => jsonIsDifferent(store, JSON.stringify($store.current)));

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
            handleDebounce(() => jsonIsDifferent(store, JSON.stringify(newValue)));
            return { ...$store, current: newValue };
        });
    }

    function handleDebounce(changeDetected: () => boolean) {
        if (onChangeOptions) {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }

            if (changeDetected()) {
                debounceTimeout = setTimeout(() => {
                    // Because this is debounced, we need to check again that there is still in fact a change.
                    // Otherwise we could inadvertently call onChange when things are already up to date.
                    if (changeDetected()) {
                        onChangeOptions.onChange();
                    }
                }, onChangeOptions.debounceDelay);
            }
        }
    }

    function set(value: T) {
        store.update(($store) => {
            handleDebounce(() => jsonIsDifferent(store, JSON.stringify(value)));
            return { ...$store, current: value };
        });
    }

    return {
        subscribe: (run: (value: T) => void) =>
            store.subscribe(($store) => run(JSON.parse(JSON.stringify($store.current)))),
        hasChanges,
        setOriginalAndCurrent,
        setOriginalOnly,
        updateOriginalAndCurrent,
        update,
        set,
    };
}

function jsonIsDifferent<T>(store: Readable<StoreValue<T>>, stringifiedCurrent: string) {
    return JSON.stringify(get(store).original) !== stringifiedCurrent;
}

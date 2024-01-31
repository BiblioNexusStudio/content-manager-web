import { writable, get } from 'svelte/store';

export function createAutosaveStore(doSave: () => Promise<void>) {
    const isSaving = writable(false);
    const showSavingFailed = writable(false);
    let retryCount = 0;
    let retryTimeout: NodeJS.Timeout | null = null;

    // Save, returning whether the save happened successfully.
    // It won't attempt a save if there's an ongoing retry loop, unless the force param is passed.
    async function save(force = false, isRetrying = false) {
        if (force || isRetrying || (!get(isSaving) && !retryTimeout)) {
            isSaving.set(true);
            try {
                await doSave();
                retryCount = 0;
                retryTimeout && clearTimeout(retryTimeout);
                retryTimeout = null;
                return true;
            } catch (error) {
                if (!force) {
                    retryCount++;
                    if (retryCount >= 4) {
                        showSavingFailed.set(true);
                    } else {
                        retryTimeout && clearTimeout(retryTimeout);
                        retryTimeout = setTimeout(() => save(false, true), 20000);
                    }
                }
            } finally {
                isSaving.set(false);
            }
            return false;
        }
        return false;
    }

    function resetSaveState() {
        retryCount = 0;
        retryTimeout && clearTimeout(retryTimeout);
        retryTimeout = null;
        showSavingFailed.set(false);
    }

    return {
        isSaving,
        showSavingFailed,
        save,
        resetSaveState,
    };
}

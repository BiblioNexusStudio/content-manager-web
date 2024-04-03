import { log } from '$lib/logger';
import type { BasicSnapshot, BasicVersion, ResourceContent, Snapshot, Version } from '$lib/types/resources';
import { formatDate } from '$lib/utils/date-time';
import { getFromApi } from '$lib/utils/http-service';
import { sortByKey } from '$lib/utils/sorting';
import { get, writable } from 'svelte/store';

type Store = {
    isLoading: boolean;
    isOpen: boolean;
    selected: ((Snapshot | Version) & { idForSelection: string }) | null;
};

export function createSidebarContentStore(resourceContent: ResourceContent) {
    const cachedSnapshots: Record<number, Snapshot> = {};
    const cachedVersions: Record<number, Version> = {};
    const store = writable<Store>({ isLoading: false, selected: null, isOpen: false });

    const publishedVersions = resourceContent.versions.filter(({ isPublished }) => isPublished);
    const firstSnapshot = resourceContent.snapshots[0];
    const allSnapshotAndPublishedVersionOptions = (
        sortByKey(
            (resourceContent.snapshots as (BasicSnapshot | BasicVersion)[]).concat(publishedVersions),
            'created',
            'desc'
        ) as (BasicSnapshot | BasicVersion)[]
    ).map((snapshotOrVersion) => ({
        value: idForSelection(snapshotOrVersion),
        label: calculateSnapshotOrVersionName(snapshotOrVersion, snapshotOrVersion.id === firstSnapshot?.id),
    }));

    function idForSelection(snapshotOrVersion: BasicSnapshot | BasicVersion) {
        return `${'version' in snapshotOrVersion ? 'version' : 'snapshot'}|${snapshotOrVersion.id}`;
    }

    function toggleViewing() {
        const isOpen = get(store).isOpen;
        if (!isOpen) {
            selectSnapshotOrVersion(allSnapshotAndPublishedVersionOptions[0]?.value ?? null);
        } else {
            selectSnapshotOrVersion(null);
        }
        store.update((current) => ({ ...current, isOpen: !isOpen }));
    }

    async function selectSnapshotOrVersion(idForSelection: string | number | null) {
        if (!idForSelection || typeof idForSelection === 'number') return;

        const [type, idString] = idForSelection.split('|');
        const id = idString ? parseInt(idString) : 0;
        if (type === 'version') {
            if (!cachedVersions[id]) {
                try {
                    store.update((current) => ({ ...current, isLoading: true }));
                    const version = await getFromApi<Version>(`/resources/content/versions/${id}`);
                    if (version) {
                        cachedVersions[id] = version;
                    }
                } catch (error) {
                    log.exception(error);
                }
            }
            store.update((current) => ({
                ...current,
                selected: cachedVersions[id] ? { ...cachedVersions[id]!, idForSelection } : null,
                isLoading: false,
            }));
        } else {
            if (!cachedSnapshots[id]) {
                try {
                    store.update((current) => ({ ...current, isLoading: true }));
                    const snapshot = await getFromApi<Snapshot>(`/resources/content/snapshots/${id}`);
                    if (snapshot) {
                        cachedSnapshots[id] = snapshot;
                    }
                } catch (error) {
                    log.exception(error);
                }
            }
            store.update((current) => ({
                ...current,
                selected: cachedSnapshots[id] ? { ...cachedSnapshots[id]!, idForSelection } : null,
                isLoading: false,
            }));
        }
    }

    function calculateSnapshotOrVersionName(snapshotOrVersion: BasicSnapshot | BasicVersion, isFirstSnapshot: boolean) {
        if ('version' in snapshotOrVersion) {
            return `${formatDate(snapshotOrVersion.created)} - Published`;
        } else {
            const isEnglish = resourceContent.language.iso6393Code.toLowerCase() === 'eng';
            if (isFirstSnapshot && isEnglish) {
                return `${formatDate(snapshotOrVersion.created)}`;
            } else if (isFirstSnapshot) {
                return `${formatDate(snapshotOrVersion.created)} English Source`;
            } else {
                return `${formatDate(snapshotOrVersion.created)} ${snapshotOrVersion.assignedUserName ?? ''}
${snapshotOrVersion.status}`;
            }
        }
    }

    return {
        toggleViewing,
        allSnapshotAndPublishedVersionOptions,
        selectSnapshotOrVersion,
        subscribe: store.subscribe,
    };
}

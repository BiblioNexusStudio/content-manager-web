<script lang="ts">
    import Modal from '$lib/components/Modal.svelte';
    import Select from '$lib/components/Select.svelte';
    import ArrowLeftSmall from '$lib/icons/ArrowLeftSmall.svelte';
    import ArrowRightSmall from '$lib/icons/ArrowRightSmall.svelte';
    import { enterKeyHandler } from '$lib/utils/enter-key-action';
    import { getFromApi } from '$lib/utils/http-service';
    import { parseNumbersListFromString } from '$lib/utils/number-list-parser';
    import { sortByKeys } from '$lib/utils/sorting';
    import type { PageData } from './$types';
    import ProjectContentSelectorTable from './ProjectContentSelectorTable.svelte';
    import type { ResourceContentForSelection } from './types';

    interface Props {
        data: PageData;
        disabled: boolean;
        languageId: number | null;
        finalizedResourceIds: number[];
        isForAquiferization: boolean;
        isAlreadyTranslated: boolean;
    }

    let {
        data,
        disabled,
        languageId,
        finalizedResourceIds = $bindable(),
        isForAquiferization,
        isAlreadyTranslated,
    }: Props = $props();

    const { parentResources } = data;

    let bibleBooks = data.bibleBooks;
    let resourceTypeId: string | null = $state(null);
    let bookCode: string | null = $state(null);
    let chaptersString = $state('');
    let searchQuery = $state('');
    let fetchedContentCache: Record<number, ResourceContentForSelection> = $state({});
    let allContentIdsOnRight: number[] = $state([]);
    let idsSelectedOnLeft: number[] = $state([]);
    let idsSelectedOnRight: number[] = $state([]);
    let fetchedContentForLeft: ResourceContentForSelection[] | null = $state(null);
    let allContentOnRight: ResourceContentForSelection[] = $state([]);
    let isFetching = $state(false);

    let showingAquiferizeEditorReviewModal = $state(false);

    let chapters = $derived(
        parseNumbersListFromString(chaptersString, 1, bibleBooks?.find((b) => b.code === bookCode)?.totalChapters ?? 0)
    );

    $effect(() => {
        // reset chapters if book code changes
        bookCode && (chaptersString = '');
    });
    $effect(() => {
        allContentIdsOnRight = allContentOnRight.map((c) => c.resourceId);
    });
    $effect(() => {
        finalizedResourceIds = [...allContentIdsOnRight];
    });
    let selectedOnLeftBeingAquiferized = $derived(
        [...idsSelectedOnLeft].map((id) => fetchedContentCache[id]!).filter((r) => r.isBeingAquiferized)
    );

    function moveToRight(force: boolean) {
        if (selectedOnLeftBeingAquiferized.length > 0 && !force) {
            showingAquiferizeEditorReviewModal = true;
        } else {
            allContentOnRight = sortByKeys(
                allContentOnRight.concat([...idsSelectedOnLeft].map((id) => fetchedContentCache[id]!)),
                ['sortOrder', 'title']
            )!;
            idsSelectedOnLeft = [];
        }
    }

    function moveToLeft() {
        allContentOnRight = allContentOnRight.filter((c) => !idsSelectedOnRight.some((id) => id === c.resourceId));
        idsSelectedOnRight = [];
    }

    async function fetchContent() {
        if (chapters.length === 0 && !searchQuery) return;

        isFetching = true;

        const searchParams = new URLSearchParams();
        searchParams.set('searchQuery', searchQuery);
        !!resourceTypeId && searchParams.set('parentResourceId', resourceTypeId);
        !!bookCode && searchParams.set('bookCode', bookCode);
        chapters.forEach((c) => searchParams.append('chapters', c.toString()));

        try {
            if (isForAquiferization) {
                fetchedContentForLeft =
                    (await getFromApi<ResourceContentForSelection[]>(
                        `/resources/unaquiferized?${searchParams.toString()}`
                    )) ?? [];
            } else if (isAlreadyTranslated) {
                !!languageId && searchParams.set('languageId', languageId.toString());
                fetchedContentForLeft =
                    (await getFromApi<ResourceContentForSelection[]>(
                        `/resources/translated?${searchParams.toString()}`
                    )) ?? [];
            } else {
                !!languageId && searchParams.set('languageId', languageId.toString());
                fetchedContentForLeft =
                    (await getFromApi<ResourceContentForSelection[]>(
                        `/resources/untranslated?${searchParams.toString()}`
                    )) ?? [];
            }
            fetchedContentForLeft.forEach((c) => (fetchedContentCache[c.resourceId] = c));
        } finally {
            isFetching = false;
        }
    }
</script>

<div class="flex flex-col overflow-hidden">
    <div class="flex flex-row space-x-4">
        <label class="form-control" for="resource-select">
            <div class="label">
                <span class="label-text">Resource</span>
            </div>
            <Select
                disabled={disabled || allContentOnRight.length > 0}
                class="select select-bordered"
                options={[
                    { value: null, label: 'Select Resource' },
                    ...(parentResources || []).map((r) => ({ value: r.id, label: r.displayName })),
                ]}
                isNumber={true}
                bind:value={resourceTypeId}
            />
        </label>
        <label class="form-control" for="book-select">
            <div class="label">
                <span class="label-text">Book</span>
            </div>
            <Select
                disabled={!resourceTypeId}
                class="select select-bordered"
                options={[
                    { value: null, label: 'Select Book' },
                    ...(bibleBooks?.map((b) => ({ value: b.code, label: b.localizedName })) ?? []),
                ]}
                bind:value={bookCode}
            />
        </label>
        <label class="form-control">
            <div class="label">
                <span class="label-text">Chapters</span>
            </div>
            <input
                class="input input-bordered"
                bind:value={chaptersString}
                disabled={!bookCode}
                placeholder="all, or 1-5, or 3,7"
                use:enterKeyHandler={fetchContent}
            />
        </label>
        <label class="form-control">
            <div class="label">
                <span class="label-text">&nbsp;</span>
            </div>
            <input
                class="input input-bordered"
                bind:value={searchQuery}
                disabled={!resourceTypeId}
                placeholder="Search"
                use:enterKeyHandler={fetchContent}
            />
        </label>
        <label class="form-control">
            <div class="label">
                <span class="label-text">&nbsp;</span>
            </div>
            <button disabled={!searchQuery && chapters.length === 0} class="btn btn-primary" onclick={fetchContent}
                >{#if isFetching}
                    <span class="loading loading-spinner"></span>
                {:else}
                    Search
                {/if}</button
            >
        </label>
    </div>
    <div class="mb-16 flex flex-row space-x-2 overflow-hidden pt-2">
        <div class="flex flex-1 flex-col">
            <div class="text-md font-semibold">
                {isForAquiferization
                    ? 'Unaquiferized Content'
                    : isAlreadyTranslated
                      ? 'Translated Content'
                      : 'Untranslated Content'}
            </div>
            <div class="overflow-auto">
                <ProjectContentSelectorTable
                    hasSearched={fetchedContentForLeft !== null}
                    allContent={(fetchedContentForLeft ?? []).filter(
                        (c) => !allContentIdsOnRight.some((id) => id === c.resourceId)
                    )}
                    isLoading={isFetching}
                    bind:selectedIds={idsSelectedOnLeft}
                />
            </div>
        </div>
        <div class="flex flex-col space-y-2 pt-6">
            <button
                disabled={idsSelectedOnLeft.length === 0}
                class="btn btn-primary btn-sm"
                onclick={() => moveToRight(false)}><ArrowRightSmall /></button
            >
            <button disabled={idsSelectedOnRight.length === 0} class="btn btn-primary btn-sm" onclick={moveToLeft}
                ><ArrowLeftSmall /></button
            >
        </div>
        <div class="flex flex-1 flex-col">
            <div class="text-md font-semibold">Project Content</div>
            <div class="overflow-auto">
                <ProjectContentSelectorTable
                    showTotalWordCount={true}
                    allContent={allContentOnRight}
                    bind:selectedIds={idsSelectedOnRight}
                />
            </div>
        </div>
    </div>
</div>

<Modal
    header="Not in Complete Status"
    bind:open={showingAquiferizeEditorReviewModal}
    primaryButtonText="Add Anyway"
    primaryButtonOnClick={() => moveToRight(true)}
    description={`The following resource items are not in a Complete status:\n\n${selectedOnLeftBeingAquiferized
        .map((r) => r.title)
        .join('\n')}\n\nIf new items are created, the published version will be used and any changes being made will not
be reflected. Are you sure you want to add them to this project?`}
/>

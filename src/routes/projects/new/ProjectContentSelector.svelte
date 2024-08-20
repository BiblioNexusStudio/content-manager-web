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

    export let data: PageData;
    export let disabled: boolean;
    export let languageId: number | null;
    export let finalizedResourceIds: number[];
    export let isForAquiferization: boolean;

    const { parentResources } = data;

    $: bibleBooks = data.bibleBooks;
    let resourceTypeId: string | null = null;
    let bookCode: string | null = null;
    let chaptersString = '';
    let searchQuery = '';
    let fetchedContentCache: Record<number, ResourceContentForSelection> = {};
    let allContentIdsOnRight: Set<number> = new Set();
    let idsSelectedOnLeft: Set<number> = new Set();
    let idsSelectedOnRight: Set<number> = new Set();
    let fetchedContentForLeft: ResourceContentForSelection[] | null = null;
    let allContentOnRight: ResourceContentForSelection[] = [];
    let isFetching = false;

    let showingAquiferizeInProgressModal = false;

    $: chapters = parseNumbersListFromString(
        chaptersString,
        1,
        bibleBooks?.find((b) => b.code === bookCode)?.totalChapters ?? 0
    );

    $: bookCode && (chaptersString = ''); // reset chapters if book code changes
    $: allContentIdsOnRight = new Set(allContentOnRight.map((c) => c.resourceId));
    $: finalizedResourceIds = [...allContentIdsOnRight];
    $: selectedOnLeftBeingAquiferized = [...idsSelectedOnLeft]
        .map((id) => fetchedContentCache[id]!)
        .filter((r) => r.isBeingAquiferized);

    function moveToRight(force: boolean) {
        if (selectedOnLeftBeingAquiferized.length > 0 && !force) {
            showingAquiferizeInProgressModal = true;
        } else {
            allContentOnRight = sortByKeys(
                allContentOnRight.concat([...idsSelectedOnLeft].map((id) => fetchedContentCache[id]!)),
                ['sortOrder', 'title']
            )!;
            idsSelectedOnLeft = new Set();
        }
    }

    function moveToLeft() {
        allContentOnRight = allContentOnRight.filter((c) => !idsSelectedOnRight.has(c.resourceId));
        idsSelectedOnRight = new Set();
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
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="form-control">
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
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="form-control">
            <div class="label">
                <span class="label-text">Book</span>
            </div>
            <Select
                disabled={!resourceTypeId}
                class="select select-bordered"
                options={[
                    { value: null, label: 'Select Book' },
                    ...(bibleBooks || []).map((b) => ({ value: b.code, label: b.localizedName })),
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
            <button disabled={!searchQuery && chapters.length === 0} class="btn btn-primary" on:click={fetchContent}
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
                {isForAquiferization ? 'Unaquiferized Content' : 'Untranslated Content'}
            </div>
            <div class="overflow-auto">
                <ProjectContentSelectorTable
                    hasSearched={fetchedContentForLeft !== null}
                    allContent={(fetchedContentForLeft ?? []).filter((c) => !allContentIdsOnRight.has(c.resourceId))}
                    isLoading={isFetching}
                    bind:selectedIds={idsSelectedOnLeft}
                />
            </div>
        </div>
        <div class="flex flex-col space-y-2 pt-6">
            <button
                disabled={idsSelectedOnLeft.size === 0}
                class="btn btn-primary btn-sm"
                on:click={() => moveToRight(false)}><ArrowRightSmall /></button
            >
            <button disabled={idsSelectedOnRight.size === 0} class="btn btn-primary btn-sm" on:click={moveToLeft}
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
    bind:open={showingAquiferizeInProgressModal}
    primaryButtonText="Add Anyway"
    primaryButtonOnClick={() => moveToRight(true)}
    description={`The following resource items are not in a Complete status:\n\n${selectedOnLeftBeingAquiferized
        .map((r) => r.title)
        .join('\n')}\n\nIf new items are created, the published version will be used and any changes being made will not
be reflected. Are you sure you want to add them to this project?`}
/>

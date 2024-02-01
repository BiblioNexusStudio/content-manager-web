<script lang="ts">
    import Select from '$lib/components/Select.svelte';
    import ArrowLeftSmall from '$lib/icons/ArrowLeftSmall.svelte';
    import ArrowRightSmall from '$lib/icons/ArrowRightSmall.svelte';
    import type { Bible } from '$lib/types/base';
    import { enterKeyHandler } from '$lib/utils/enter-key-action';
    import { unwrapStreamedDataWithCallback } from '$lib/utils/http-service';
    import { parseNumbersListFromString } from '$lib/utils/number-list-parser';
    import type { PageData } from './$types';
    import ProjectContentSelectorTable from './ProjectContentSelectorTable.svelte';
    import type { ResourceContentForSelection } from './types';

    export let data: PageData;
    export let disabled: boolean;
    export let finalizedResourceContentIds: number[];
    export let isForAquiferization: boolean;

    const { resourceTypes } = data;

    $: unwrapStreamedDataWithCallback(data.bibles, (fetchedBibles) => (bible = fetchedBibles[0]));

    let bible: Bible | undefined;
    let resourceTypeId: string | null = null;
    let bookCode: string | null = null;
    let chaptersString = '';
    let searchQuery = '';
    let fetchedContentCache: Record<number, ResourceContentForSelection> = {};
    let allContentIdsOnRight: Set<number> = new Set();
    let idsSelectedOnLeft: Set<number> = new Set();
    let idsSelectedOnRight: Set<number> = new Set();
    let fetchedContentForLeft: ResourceContentForSelection[] = [];
    let allContentOnRight: ResourceContentForSelection[] = [];
    let isFetching = false;

    $: chapters = parseNumbersListFromString(
        chaptersString,
        1,
        bible?.books.find((b) => b.bookCode === bookCode)?.chapterCount ?? 0
    );

    $: bookCode && (chaptersString = ''); // reset chapters if book code changes
    $: allContentIdsOnRight = new Set(allContentOnRight.map((c) => c.resourceContentId));
    $: finalizedResourceContentIds = [...allContentIdsOnRight];

    function sortByName(a: ResourceContentForSelection, b: ResourceContentForSelection) {
        return a.title.localeCompare(b.title);
    }

    function moveToRight() {
        allContentOnRight = allContentOnRight
            .concat([...idsSelectedOnLeft].map((id) => fetchedContentCache[id]!))
            .sort(sortByName);
        idsSelectedOnLeft = new Set();
    }

    function moveToLeft() {
        allContentOnRight = allContentOnRight.filter((c) => !idsSelectedOnRight.has(c.resourceContentId));
        idsSelectedOnRight = new Set();
    }

    function getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    async function fetchContent() {
        if (chapters.length === 0 && !searchQuery) return;

        isFetching = true;
        try {
            const sampleContent = [
                { title: 'Genesis 1.1', wordCount: 34, resourceContentId: 1 },
                { title: 'Exodus 3.14', wordCount: 45, resourceContentId: 2 },
                { title: 'Matthew 5.16', wordCount: 28, resourceContentId: 3 },
                { title: 'John 3.16', wordCount: 33, resourceContentId: 4 },
                { title: 'Romans 8.28', wordCount: 37, resourceContentId: 5 },
            ];

            // Simulate network request delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Randomly select some content to mimic dynamic content fetching
            fetchedContentForLeft = sampleContent
                .sort(() => 0.5 - Math.random())
                .slice(0, getRandomInt(1, sampleContent.length));
            fetchedContentForLeft.forEach((c) => (fetchedContentCache[c.resourceContentId] = c));
        } finally {
            isFetching = false;
        }
    }
</script>

<div class="flex flex-col">
    <div class="flex flex-row space-x-4">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="form-control">
            <div class="label">
                <span class="label-text">Type</span>
            </div>
            <Select
                disabled={disabled || allContentOnRight.length > 0}
                class="select select-bordered"
                options={[
                    { value: null, label: 'Select Type' },
                    ...resourceTypes.map((r) => ({ value: r.id, label: r.displayName })),
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
                    ...(bible?.books || []).map((b) => ({ value: b.bookCode, label: b.displayName })),
                ]}
                bind:value={bookCode}
            />
        </label>
        <!-- svelte-ignore a11y-label-has-associated-control -->
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
    <div class="flex flex-row space-x-2 pt-2">
        <div class="flex flex-1 flex-col">
            <div class="text-md font-semibold">
                {isForAquiferization ? 'Unaquiferized Content' : 'Untranslated Content'}
            </div>
            <ProjectContentSelectorTable
                allContent={fetchedContentForLeft.filter((c) => !allContentIdsOnRight.has(c.resourceContentId))}
                bind:selectedIds={idsSelectedOnLeft}
            />
        </div>
        <div class="flex flex-col space-y-2 pt-6">
            <button disabled={idsSelectedOnLeft.size === 0} class="btn btn-primary btn-sm" on:click={moveToRight}
                ><ArrowRightSmall /></button
            >
            <button disabled={idsSelectedOnRight.size === 0} class="btn btn-primary btn-sm" on:click={moveToLeft}
                ><ArrowLeftSmall /></button
            >
        </div>
        <div class="flex flex-1 flex-col">
            <div class="text-md font-semibold">Project Content</div>
            <ProjectContentSelectorTable
                showTotalWordCount={true}
                allContent={allContentOnRight}
                bind:selectedIds={idsSelectedOnRight}
            />
        </div>
    </div>
</div>

<script lang="ts">
    import type { PageData } from './$types';
    import { buildQueryString, searchParameters, ssp, type Param } from '$lib/utils/sveltekit-search-params';
    import { SortName, createEditorDashboardMyHistorySorter } from './dashboard-table-sorters';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import { utcDateTimeStringToDateTime } from '$lib/utils/date-time';
    import type { ResourceAssignedToSelfHistory } from './+page';
    import Table from '$lib/components/Table.svelte';
    import { myHistoryColumns, resourcesThatNeedTranslationColumns } from './community-reviewer-dashboard-columns';
    import TableCell from '$lib/components/TableCell.svelte';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import type {
        ResourceAssignedToSelf,
        ResourceThatNeedsTranslation,
        ResourceThatNeedsTranslationResponse,
    } from './+page';
    import { getFromApi } from '$lib/utils/http-service';
    import Select from '$lib/components/Select.svelte';
    import { _ as translate } from 'svelte-i18n';
    import { enterKeyHandler } from '$lib/utils/enter-key-action';
    import type { BibleBook } from '$lib/types/base';
    import { parseStartAndEndFromSingleOrRangeString } from '$lib/utils/number-list-parser';
    import { debounce } from '$lib/utils/debounce';

    const sortMyHistoryData = createEditorDashboardMyHistorySorter();

    export let data: PageData;

    enum Tab {
        resources = 'resources',
        myHistory = 'my-history',
    }

    const switchTabs = (tab: Tab) => {
        if ($searchParams.tab !== tab) {
            $searchParams.tab = tab;
            $searchParams.sort = tab === Tab.resources ? SortName.Title : '-' + SortName.Days;
        }
    };

    const searchParams = searchParameters(
        {
            sort: ssp.string(`-${SortName.Days}`),
            tab: ssp.string(Tab.resources),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    let myHistorySearchQuery = '';
    let myHistoryContents: ResourceAssignedToSelfHistory[] = [];
    // eslint-disable-next-line
    let table: Table<any> | null;
    $: $searchParams.sort && table?.resetScroll();

    let currentlyReviewingItem: ResourceAssignedToSelf | null = null;
    let resourcesThatNeedTranslation: ResourceThatNeedsTranslation[] | null = null;
    let resourcesThatNeedTranslationParams: Param[] = [];
    let resourcesSearchQuery = '';
    let bibleBooks: BibleBook[] | null = null;
    let parentResourceId = 0;
    let bookCode = '';
    let chapterRange = '';
    let currentPage = 1;
    let totalItems = 0;
    let itemsPerPage = 50;
    let isLoading = false;

    $: parsedRange = parseStartAndEndFromSingleOrRangeString(chapterRange, 1, calculateMaxChapter(bibleBooks));
    $: invalidChapterRange = !!chapterRange && parsedRange.start === 0 && parsedRange.end === 0;
    $: canApplyFilters = (!!resourcesSearchQuery || !!parentResourceId || !!bookCode) && !invalidChapterRange;

    // When currentPage or itemsPerPage change, fetch
    $: currentPage && itemsPerPage && debouncedFetchResources(true);

    // Debounce to ensure if currentPage and itemsPerPage change in quick succession we don't fire multiple requests
    const debouncedFetchResources = debounce(fetchResources, 50);

    async function fetchResources(usePreviousParams = false) {
        if ($searchParams.tab === Tab.resources && canApplyFilters) {
            isLoading = true;
            const parsedRange = parseStartAndEndFromSingleOrRangeString(
                chapterRange,
                1,
                calculateMaxChapter(bibleBooks)
            );
            const offset = (currentPage - 1) * itemsPerPage;
            if (!usePreviousParams) {
                resourcesThatNeedTranslationParams = [
                    { key: 'parentResourceId', value: parentResourceId, ignoreIfEquals: 0 },
                    { key: 'bookCode', value: bookCode, ignoreIfEquals: '' },
                    { key: 'startChapter', value: parsedRange.start, ignoreIfEquals: 0 },
                    { key: 'endChapter', value: parsedRange.end, ignoreIfEquals: 0 },
                    { key: 'searchQuery', value: resourcesSearchQuery, ignoreIfEquals: '' },
                ];
            }
            const queryString = buildQueryString([
                ...resourcesThatNeedTranslationParams,
                { key: 'limit', value: itemsPerPage },
                { key: 'offset', value: offset, ignoreIfEquals: 0 },
            ]);
            const response = await getFromApi<ResourceThatNeedsTranslationResponse>(
                `/resources/content/needs-translation?${queryString}`
            );
            resourcesThatNeedTranslation = response?.resourceContents ?? [];
            totalItems = response?.total ?? 0;
            isLoading = false;
        }
    }

    function filterAndSortMyHistoryData(
        myHistoryContents: ResourceAssignedToSelfHistory[],
        sort: string,
        search: string
    ) {
        return sortMyHistoryData(
            myHistoryContents.filter((x) => x.englishLabel.toLowerCase().includes(search.toLowerCase())),
            sort
        );
    }

    const loadContents = async () => {
        let myAssignedContents: ResourceAssignedToSelf[];
        [bibleBooks, myAssignedContents, myHistoryContents] = await Promise.all([
            data.communityReviewerDashboard!.bibleBooks.promise,
            data.communityReviewerDashboard!.assignedResourceContent.promise,
            data.communityReviewerDashboard!.assignedResourceHistoryContent.promise,
        ]);
        currentlyReviewingItem = myAssignedContents[0] ?? null;
    };

    function calculateMaxChapter(bibleBooks: BibleBook[] | null) {
        return bibleBooks?.find((b) => b.code === bookCode)?.totalChapters ?? 0;
    }
</script>

{#await loadContents()}
    <CenteredSpinnerFullScreen />
{:then _}
    <div class="flex h-full flex-col space-y-4 overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Community Reviewer Dashboard</h1>
        {#if currentlyReviewingItem}
            <div class="text-lg">
                <span>You are currently reviewing this item:</span>
                <a class="text-lg font-bold text-primary underline" href="/resources/{currentlyReviewingItem.id}"
                    >{currentlyReviewingItem.englishLabel}</a
                >
            </div>
        {/if}
        <div class="flex flex-shrink-0 flex-row items-center">
            <div role="tablist" class="tabs-bordered tabs w-fit">
                <button
                    on:click={() => switchTabs(Tab.resources)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.resources && 'tab-active'}">Resources</button
                >
                <button
                    on:click={() => switchTabs(Tab.myHistory)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myHistory && 'tab-active'}"
                    >My History ({myHistoryContents.length})</button
                >
            </div>
        </div>
        <div class="flex gap-4">
            {#if $searchParams.tab === Tab.resources}
                <input
                    class="input input-bordered max-w-xs focus:outline-none"
                    bind:value={resourcesSearchQuery}
                    use:enterKeyHandler={fetchResources}
                    placeholder="Search"
                />
            {:else if $searchParams.tab === Tab.myHistory}
                <input
                    class="input input-bordered max-w-xs focus:outline-none"
                    bind:value={myHistorySearchQuery}
                    placeholder="Search"
                />
            {/if}
            {#if $searchParams.tab === Tab.resources}
                <Select
                    appInsightsEventName="resources-resources-filter-selection"
                    bind:value={parentResourceId}
                    isNumber={true}
                    class="select select-bordered min-w-[10rem] flex-grow"
                    options={[
                        { value: 0, label: $translate('page.resources.dropdowns.allResources.value') },
                        ...data.parentResources.map((t) => ({ value: t.id, label: t.displayName })),
                    ]}
                />
                <Select
                    appInsightsEventName="resources-book-filter-selection"
                    class="select select-bordered min-w-[9rem] flex-grow"
                    options={[
                        { value: '', label: 'Select Book' },
                        ...(bibleBooks || []).map((b) => ({ value: b.code, label: b.localizedName })),
                    ]}
                    onChange={() => (chapterRange = '')}
                    bind:value={bookCode}
                />
                <input
                    disabled={!bookCode}
                    bind:value={chapterRange}
                    use:enterKeyHandler={fetchResources}
                    class="input input-bordered input-md w-[11rem] focus:outline-none"
                    placeholder="Chapter (e.g. 2, 1-5)"
                />
                <button class="btn btn-primary" disabled={!canApplyFilters} on:click={() => fetchResources()}
                    >Apply</button
                >
            {/if}
        </div>
        {#if $searchParams.tab === Tab.resources}
            <Table
                class="!mb-2"
                columns={resourcesThatNeedTranslationColumns}
                items={resourcesThatNeedTranslation ?? []}
                idColumn="id"
                itemUrlPrefix="/resources/"
                noItemsText={resourcesThatNeedTranslation
                    ? 'No results'
                    : 'Search or filter to see resource items that need translations'}
                {isLoading}
                bind:currentPage
                bind:itemsPerPage
                {totalItems}
                let:item
                let:href
                let:itemKey
            >
                {#if href !== undefined && itemKey}
                    <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                {:else if itemKey}
                    <TableCell>{item[itemKey] ?? ''}</TableCell>
                {/if}
            </Table>
        {:else if $searchParams.tab === Tab.myHistory}
            <Table
                bind:this={table}
                class="!mb-2"
                columns={myHistoryColumns}
                items={filterAndSortMyHistoryData(myHistoryContents, $searchParams.sort, myHistorySearchQuery)}
                idColumn="id"
                itemUrlPrefix="/resources/"
                bind:searchParams={$searchParams}
                noItemsText="No history items"
                let:item
                let:href
                let:itemKey
            >
                {#if itemKey === 'lastActionTime' && item[itemKey] !== null}
                    <LinkedTableCell {href}
                        >{utcDateTimeStringToDateTime(item[itemKey]).toLocaleDateString()}</LinkedTableCell
                    >
                {:else if href !== undefined && itemKey}
                    <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                {:else if itemKey}
                    <TableCell>{item[itemKey] ?? ''}</TableCell>
                {/if}
            </Table>
        {/if}
    </div>
{:catch error}
    <ErrorMessage uncastError={error} />
{/await}

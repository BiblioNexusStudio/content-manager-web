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
    import type { ResourceThatNeedsTranslation, ResourceThatNeedsTranslationResponse } from './+page';
    import { getFromApi } from '$lib/utils/http-service';
    import Select from '$lib/components/Select.svelte';
    import { _ as translate } from 'svelte-i18n';
    import { enterKeyHandler } from '$lib/utils/enter-key-action';
    import type { BibleBook } from '$lib/types/base';
    import { parseStartAndEndFromSingleOrRangeString } from '$lib/utils/number-list-parser';
    import { debounce } from '$lib/utils/debounce';
    import { onMount, untrack } from 'svelte';
    import { _CommunityReviewerTab as Tab } from './+page';
    import { Icon } from 'svelte-awesome';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import Document from '$lib/components/help/Document.svelte';
    import {
        notificationsContentColumns,
        markNotificationAsReadAndGoToResourcePage,
        markAllSelectedNotificationsAsRead,
    } from './notifications-helpers';
    import type { FlattenedNotificationsContent } from './proxy+page';

    const sortMyHistoryData = createEditorDashboardMyHistorySorter();

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let bibleBooks = $derived(data.communityReviewerDashboard!.bibleBooks);
    let myAssignedContents = $derived(data.communityReviewerDashboard!.assignedResourceContent);
    let myHistoryContents = $derived(data.communityReviewerDashboard!.assignedResourceHistoryContent);
    let flattenedNotificationsContent = $derived(data.communityReviewerDashboard!.flattenedNotificationsContent);
    let currentlyReviewingItem = $derived(myAssignedContents[0]);
    let currentNotifications: FlattenedNotificationsContent[] = $state([]);
    let selectedNotifications: FlattenedNotificationsContent[] = $state([]);
    let helpDocs = $derived.by(() => {
        return data.communityReviewerDashboard!.helpDocs?.howTos.filter((item) => {
            return item.title === 'Commenting' || item.title === 'Versions and Bible Panes';
        });
    });

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
            isShowingOnlyUnread: ssp.boolean(false),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    let myHistorySearchQuery = $state('');
    let table:
        | Table<ResourceThatNeedsTranslation>
        | Table<ResourceAssignedToSelfHistory>
        | Table<FlattenedNotificationsContent>
        | undefined = $state(undefined);

    $effect(() => {
        if ($searchParams.sort && table) {
            untrack(() => {
                table?.resetScroll();
            });
        }
    });

    $effect(() => {
        currentPage && itemsPerPage && debouncedFetchResources(true);
    });

    let resourcesThatNeedTranslation: ResourceThatNeedsTranslation[] | null = $state(null);
    let resourcesThatNeedTranslationParams: Param[] = $state([]);
    let resourcesSearchQuery = $state('');
    let parentResourceId = $state(0);
    let bookCode = $state('');
    let chapterRange = $state('');
    let currentPage = $state(1);
    let totalItems = $state(0);
    let itemsPerPage = $state(50);
    let isLoading = $state(false);

    let parsedRange = $derived(
        parseStartAndEndFromSingleOrRangeString(chapterRange, 1, calculateMaxChapter(bibleBooks))
    );

    let invalidChapterRange = $derived(!!chapterRange && parsedRange.start === 0 && parsedRange.end === 0);

    let canApplyFilters = $derived(
        (!!resourcesSearchQuery || !!parentResourceId || !!bookCode) && !invalidChapterRange
    );

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

    function calculateMaxChapter(bibleBooks: BibleBook[]) {
        return bibleBooks.find((b) => b.code === bookCode)?.totalChapters ?? 0;
    }

    function filterNotifications(isShowingOnlyUnread: boolean) {
        currentNotifications = flattenedNotificationsContent.filter((n) => {
            if (isShowingOnlyUnread) {
                return !n.isRead;
            } else {
                return true;
            }
        });
    }

    $effect(() => {
        filterNotifications($searchParams.isShowingOnlyUnread);
    });

    onMount(() => {
        const viewedHelpTab = localStorage.getItem('communityReviewerHasViewedHelpTab');
        $searchParams.tab = viewedHelpTab === 'true' ? Tab.resources : Tab.help;
        localStorage.setItem('communityReviewerHasViewedHelpTab', 'true');
    });
</script>

<div class="flex h-full flex-col space-y-4 overflow-y-hidden px-4">
    <h1 class="pt-4 text-3xl">Dashboard</h1>
    {#if currentlyReviewingItem}
        <div class="text-lg">
            <span>You are currently reviewing this item:</span>
            <a class="text-lg font-bold text-primary underline" href="/resources/{currentlyReviewingItem.id}"
                >{currentlyReviewingItem.englishLabel}</a
            >
        </div>
    {/if}
    <div class="flex flex-shrink-0 flex-row items-center">
        <div role="tablist" class="tabs tabs-bordered w-fit">
            <button
                onclick={() => switchTabs(Tab.resources)}
                role="tab"
                class="tab {$searchParams.tab === Tab.resources && 'tab-active'}">Resources</button
            >
            <button
                onclick={() => switchTabs(Tab.myHistory)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myHistory && 'tab-active'}"
                >My History ({myHistoryContents.length})</button
            >
            <button
                onclick={() => switchTabs(Tab.help)}
                role="tab"
                class="tab {$searchParams.tab === Tab.help && 'tab-active'}">Help</button
            >
            <button
                onclick={() => switchTabs(Tab.notifications)}
                role="tab"
                class="tab {$searchParams.tab === Tab.notifications && 'tab-active'}"
                >Notifications ({flattenedNotificationsContent.filter((n) => !n.isRead).length})</button
            >
        </div>
    </div>
    <div class="flex flex-shrink-0 gap-4 overflow-x-auto">
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
                class="select select-bordered min-w-[10rem]"
                options={[
                    { value: 0, label: $translate('page.resources.dropdowns.allResources.value') },
                    ...data.parentResources.map((t) => ({ value: t.id, label: t.displayName })),
                ]}
            />
            <Select
                appInsightsEventName="resources-book-filter-selection"
                class="select select-bordered min-w-[9rem]"
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
            <button class="btn btn-primary" disabled={!canApplyFilters} onclick={() => fetchResources()}>Apply</button>
        {/if}
        {#if $searchParams.tab === Tab.notifications}
            <button
                data-app-insights-event-name="manager-dashboard-mark-read-click"
                class="btn btn-primary"
                onclick={() => markAllSelectedNotificationsAsRead(selectedNotifications)}
                disabled={selectedNotifications.length === 0 || selectedNotifications.every((n) => n.isRead)}
                >Mark Read
            </button>
            <label class="label cursor-pointer py-0 opacity-70">
                <input
                    type="checkbox"
                    bind:checked={$searchParams.isShowingOnlyUnread}
                    data-app-insights-event-name="manager-dashboard-show-only-unread-toggle"
                    class="checkbox no-animation checkbox-sm me-2"
                />
                <span class="label-text text-xs">Show Only Unread</span>
            </label>
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
        >
            {#snippet tableCells(item, href, itemKey)}
                {#if href !== undefined && itemKey}
                    <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                {:else if itemKey === 'hasAudio'}
                    <TableCell>
                        {#if item.hasAudio}
                            <Icon data={volumeUp} class="h-4 w-4" />
                        {/if}
                    </TableCell>
                {:else if itemKey}
                    <TableCell>{item[itemKey] ?? ''}</TableCell>
                {/if}
            {/snippet}
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
        >
            {#snippet tableCells(item, href, itemKey)}
                {#if itemKey === 'lastActionTime' && item[itemKey] !== null}
                    <LinkedTableCell {href}
                        >{utcDateTimeStringToDateTime(item[itemKey]).toLocaleDateString()}</LinkedTableCell
                    >
                {:else if itemKey === 'hasAudio'}
                    <TableCell>
                        {#if item.hasAudio}
                            <Icon data={volumeUp} class="h-4 w-4" />
                        {/if}
                    </TableCell>
                {:else if href !== undefined && itemKey}
                    <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                {:else if itemKey}
                    <TableCell>{item[itemKey] ?? ''}</TableCell>
                {/if}
            {/snippet}
        </Table>
    {:else if $searchParams.tab === Tab.help}
        <div class="flex">
            {#each helpDocs as document (document.title)}
                <Document {document} />
            {/each}
        </div>
    {:else if $searchParams.tab === Tab.notifications}
        <Table
            bind:this={table}
            class="my-4"
            idColumn="id"
            enableSelectAll={true}
            columns={notificationsContentColumns}
            items={currentNotifications}
            noItemsText="No notifications."
            bind:selectedItems={selectedNotifications}
        >
            {#snippet customTbody(rowItems, selectedItems, onSelectItem)}
                <tbody>
                    {#each rowItems as notificationItem (notificationItem.id)}
                        <tr
                            class={notificationItem.isRead ? 'cursor-pointer' : 'cursor-pointer font-bold'}
                            onclick={() => markNotificationAsReadAndGoToResourcePage(notificationItem)}
                        >
                            <TableCell class="w-4" stopPropagation={true}>
                                <input
                                    type="checkbox"
                                    class="checkbox checkbox-sm"
                                    onchange={() => onSelectItem(notificationItem)}
                                    checked={selectedItems?.includes(notificationItem)}
                                />
                            </TableCell>
                            <TableCell>{notificationItem['time']}</TableCell>
                            <TableCell>{notificationItem['name']}</TableCell>
                            <TableCell>{notificationItem['notification']}</TableCell>
                        </tr>
                    {/each}
                    {#if rowItems.length === 0}
                        <tr>
                            <td colspan="99" class="text-center"> No notifications. </td>
                        </tr>
                    {/if}
                </tbody>
            {/snippet}
        </Table>
    {/if}
</div>

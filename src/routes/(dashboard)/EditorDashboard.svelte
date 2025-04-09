<script lang="ts">
    import type { PageData } from './$types';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import {
        SortName,
        createEditorDashboardMyWorkSorter,
        createEditorDashboardMyHistorySorter,
    } from './dashboard-table-sorters';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import { formatSimpleDaysAgo, utcDateTimeStringToDateTime } from '$lib/utils/date-time';
    import { type ResourceAssignedToSelf, type ResourceAssignedToSelfHistory, _EditorTab as Tab } from './+page';
    import Table from '$lib/components/Table.svelte';
    import { myHistoryColumns, myWorkColumns } from './editor-dashboard-columns';
    import TableCell from '$lib/components/TableCell.svelte';
    import { download } from '$lib/utils/csv-download-handler';
    import Select from '$lib/components/Select.svelte';
    import { filterBoolean } from '$lib/utils/array';
    import { untrack } from 'svelte';
    import Modal from '$lib/components/Modal.svelte';
    import UserSelector from '../resources/[resourceContentId]/UserSelector.svelte';
    import { UserRole, ResourceContentStatusEnum } from '$lib/types/base';
    import { userIsInCompany, userCan, Permission } from '$lib/stores/auth';
    import { postToApi } from '$lib/utils/http-service';
    import { log } from '$lib/logger';
    import { Icon } from 'svelte-awesome';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import type { FlattenedNotificationsContent } from './proxy+page';
    import {
        notificationsContentColumns,
        markNotificationAsReadAndGoToResourcePage,
        markAllSelectedNotificationsAsRead,
    } from './notifications-helpers';
    import PaginatedTableWrapper from '$lib/components/PaginatedTableWrapper.svelte';

    const sortMyWorkData = createEditorDashboardMyWorkSorter();
    const sortMyHistoryData = createEditorDashboardMyHistorySorter();

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let myWorkContents = data.editorDashboard!.assignedResourceContent;
    let myHistoryContents = data.editorDashboard!.assignedResourceHistoryContent;
    let flattenedNotificationsContent = data.editorDashboard!.flattenedNotificationsContent;
    let isAssignContentModalOpen = $state(false);
    let isSendToPublisherModalOpen = $state(false);
    let isSendToReviewModalOpen = $state(false);

    let selectedMyWorkContents: ResourceAssignedToSelf[] = $state([]);
    let selectedNotifications: FlattenedNotificationsContent[] = $state([]);
    let isTransacting = $state(false);
    let assignToUserId: number | null = $state(null);
    let errorModalText: string | null = $state(null);
    let isReviewer = $derived($userCan(Permission.SendReviewContent));
    let isAssignButtonDisabled = $derived(() => selectedMyWorkContents.length === 0);
    let isSendToPublisherButtonDisabled = $derived(
        () =>
            selectedMyWorkContents.length === 0 ||
            !selectedMyWorkContents.every((x) => x.statusValue === ResourceContentStatusEnum.TranslationCompanyReview)
    );
    let isSendToCompanyReviewButtonDisabled = $derived(
        () =>
            selectedMyWorkContents.length === 0 ||
            !selectedMyWorkContents.every(
                (x) =>
                    x.statusValue === ResourceContentStatusEnum.TranslationEditorReview ||
                    x.statusValue === ResourceContentStatusEnum.AquiferizeEditorReview
            )
    );

    const downloadMyHistoryCsv = () => {
        download(
            myHistoryContents.map((x) => ({
                ...x,
                lastActionTime: utcDateTimeStringToDateTime(x.lastActionTime).toLocaleDateString(),
            })),
            `my-history-${new Date().toISOString()}`,
            {
                englishLabel: 'Title',
                parentResourceName: 'Resource',
                lastActionTime: 'My Last Action',
                sourceWords: 'Source Words',
            }
        );
    };

    const switchTabs = (tab: Tab) => {
        if ($searchParams.tab !== tab) {
            $searchParams.tab = tab;
            $searchParams.sort = '-' + SortName.Days;
        }
    };

    const searchParams = searchParameters(
        {
            sort: ssp.string(`-${SortName.Days}`),
            tab: ssp.string(Tab.myWork),
            project: ssp.string(''),
            isFilteringUnresolved: ssp.boolean(false),
            isShowingOnlyUnread: ssp.boolean(false),
            pageNumber: ssp.number(1),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    const setTabContents = (
        tab: string,
        search: string,
        project: string,
        isFilteringUnresolved: boolean,
        isShowingOnlyUnread: boolean
    ) => {
        if (tab === Tab.myWork) {
            visibleMyWorkContents = myWorkContents.filter(
                (x) =>
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (!project || x.projectName === project) &&
                    (!isFilteringUnresolved || x.hasUnresolvedCommentThreads === true)
            );
        } else if (tab === Tab.myHistory) {
            visibleMyHistoryContents = myHistoryContents.filter((x) =>
                x.englishLabel.toLowerCase().includes(search.toLowerCase())
            );
        } else if (tab === Tab.notifications) {
            visibleNotificationContents = flattenedNotificationsContent.filter((n) => {
                if (isShowingOnlyUnread) {
                    return !n.isRead;
                } else {
                    return true;
                }
            });
        }
    };

    function editorsThatCanBeAssigned() {
        return data.users?.filter((u) => $userIsInCompany(u.company.id) && u.role !== UserRole.ReportViewer) ?? null;
    }

    const assignEditor = async (contentIds: number[]) => {
        if (contentIds.length > 0) {
            await postToApi<null>('/resources/content/send-for-editor-review', {
                assignedUserId: assignToUserId,
                contentIds: contentIds,
            });
        }
    };

    const sendForPublisherReview = async (contentIds: number[]) => {
        if (contentIds.length > 0) {
            try {
                await postToApi<null>('/resources/content/send-for-publisher-review', {
                    contentIds: contentIds,
                });
            } catch (error) {
                log.exception(error);
                throw error;
            }
        }
    };

    const sendForCompanyReview = async (contentIds: number[]) => {
        if (contentIds.length > 0) {
            try {
                await postToApi<null>('/resources/content/send-for-company-review', {
                    contentIds: contentIds,
                });
            } catch (error) {
                log.exception(error);
                throw error;
            }
        }
    };

    async function updateContent(action: (contentIds: number[]) => Promise<void>) {
        isTransacting = true;

        try {
            const contentIds = [...selectedMyWorkContents.map((x) => x.id)];
            await action(contentIds);
            isTransacting = false;
            window.location.reload();
        } catch {
            errorModalText = 'Error Assigning content.';
            isTransacting = false;
        }
    }

    let search = $state('');
    let visibleMyWorkContents: ResourceAssignedToSelf[] = $state([]);
    let visibleMyHistoryContents: ResourceAssignedToSelfHistory[] = $state([]);
    let visibleNotificationContents: FlattenedNotificationsContent[] = $state([]);
    let sortedMyWorkContents: ResourceAssignedToSelf[] = $derived(
        sortMyWorkData(visibleMyWorkContents, $searchParams.sort)
    );
    let sortedMyHistoryContents: ResourceAssignedToSelfHistory[] = $derived(
        sortMyHistoryData(visibleMyHistoryContents, $searchParams.sort)
    );

    // -- Pagination --
    let pageLimit = $state(100);

    let table:
        | Table<ResourceAssignedToSelfHistory>
        | Table<ResourceAssignedToSelf>
        | Table<FlattenedNotificationsContent>
        | undefined = $state(undefined);

    $effect(() => {
        if ($searchParams.sort && table !== undefined) {
            untrack(() => table?.resetScroll());
        }
    });

    $effect(() => {
        setTabContents(
            $searchParams.tab,
            search,
            $searchParams.project,
            $searchParams.isFilteringUnresolved,
            $searchParams.isShowingOnlyUnread
        );
    });

    function projectNamesForContents(contents: ResourceAssignedToSelf[]) {
        return Array.from(new Set(filterBoolean(contents.map((c) => c.projectName)))).sort();
    }
</script>

<div class="flex flex-col overflow-y-hidden px-4">
    <h1 class="pt-4 text-3xl">Dashboard</h1>
    <div class="flex flex-row items-center pt-4">
        <div role="tablist" class="tabs tabs-border w-fit">
            <button
                onclick={() => switchTabs(Tab.myWork)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}">My Work ({myWorkContents.length})</button
            >
            <button
                onclick={() => switchTabs(Tab.myHistory)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myHistory && 'tab-active'}"
                >My History ({myHistoryContents.length})</button
            >
            <button
                onclick={() => switchTabs(Tab.notifications)}
                role="tab"
                class="tab {$searchParams.tab === Tab.notifications && 'tab-active'}"
                >Notifications ({flattenedNotificationsContent.filter((n) => !n.isRead).length})</button
            >
        </div>
    </div>
    <div class="mt-4 flex gap-4">
        {#if $searchParams.tab !== Tab.notifications}
            <input
                class="input input-bordered max-w-xs focus:outline-hidden"
                bind:value={search}
                placeholder="Search"
            />
        {/if}
        {#if $searchParams.tab === Tab.myWork}
            <Select
                class="select select-bordered max-w-[14rem] grow"
                bind:value={$searchParams.project}
                options={[
                    { value: '', label: 'Project' },
                    ...projectNamesForContents(myWorkContents).map((p) => ({ value: p, label: p })),
                ]}
            />
            <label class="label max-h-[40px] cursor-pointer py-0 opacity-70">
                <input
                    type="checkbox"
                    bind:checked={$searchParams.isFilteringUnresolved}
                    data-app-insights-event-name="editor-dashboard-has-unresolved-comments-toggle-{$searchParams.isFilteringUnresolved
                        ? 'off'
                        : 'on'}"
                    class="checkbox no-animation checkbox-sm me-2"
                />
                <span class="label-text text-xs text-wrap">Has Unresolved Comments</span>
            </label>
        {/if}
        {#if $searchParams.tab === Tab.myWork}
            <button
                data-app-insights-event-name="editor-dashboard-bulk-assign-click"
                class="btn btn-primary"
                onclick={() => (isAssignContentModalOpen = true)}
                disabled={isAssignButtonDisabled()}
                >Assign
            </button>
        {/if}
        {#if $searchParams.tab === Tab.myWork && !isReviewer}
            <Tooltip
                position={{ left: '9rem' }}
                text={isSendToCompanyReviewButtonDisabled() && selectedMyWorkContents.length > 0
                    ? 'Editor Review status only'
                    : null}
            >
                <button
                    data-app-insights-event-name="editor-dashboard-bulk-send-to-review-click"
                    class="btn btn-primary"
                    onclick={() => (isSendToReviewModalOpen = true)}
                    disabled={isSendToCompanyReviewButtonDisabled()}
                    >Send to Review
                </button>
            </Tooltip>
        {/if}
        {#if $searchParams.tab === Tab.myWork && isReviewer}
            <Tooltip
                position={{ left: '10rem' }}
                text={isSendToPublisherButtonDisabled() && selectedMyWorkContents.length > 0
                    ? 'Company Review status only'
                    : null}
            >
                <button
                    data-app-insights-event-name="editor-dashboard-bulk-send-to-publisher-click"
                    class="btn btn-primary"
                    onclick={() => (isSendToPublisherModalOpen = true)}
                    disabled={isSendToPublisherButtonDisabled()}
                    >Send to Publisher
                </button>
            </Tooltip>
        {/if}
        {#if $searchParams.tab === Tab.myWork}
            <div class="my-1 ml-auto flex flex-col items-end justify-center">
                <div class="text-end text-sm text-gray-500">Total Items: {visibleMyWorkContents.length}</div>
                <div class="text-end text-sm text-gray-500">
                    Total Source Words: {visibleMyWorkContents
                        .reduce((sum, x) => sum + (x?.wordCount ?? 0), 0)
                        .toLocaleString()}
                </div>
            </div>
        {/if}
        {#if $searchParams.tab === Tab.myHistory}
            <button
                data-app-insights-event-name="editor-dashboard-download-my-history-csv-click"
                class="btn btn-primary"
                onclick={downloadMyHistoryCsv}>Download Word Counts</button
            >
        {/if}
        {#if $searchParams.tab === Tab.notifications}
            <button
                data-app-insights-event-name="editor-dashboard-mark-read-click"
                class="btn btn-primary"
                onclick={async () => {
                    await markAllSelectedNotificationsAsRead(selectedNotifications);
                    selectedNotifications = [];
                }}
                disabled={selectedNotifications.length === 0 || selectedNotifications.every((n) => n.isRead)}
                >Mark Read
            </button>
            <label class="label cursor-pointer py-0 opacity-70">
                <input
                    type="checkbox"
                    bind:checked={$searchParams.isShowingOnlyUnread}
                    data-app-insights-event-name="editor-dashboard-show-only-unread-toggle"
                    class="checkbox no-animation checkbox-sm me-2"
                />
                <span class="label-text text-xs">Show Only Unread</span>
            </label>
        {/if}
    </div>
    {#if $searchParams.tab === Tab.myWork}
        <PaginatedTableWrapper
            bind:pageLimit
            sortedContents={sortedMyWorkContents}
            bind:currentPage={$searchParams.pageNumber}
        >
            {#snippet paginatedTable(customItemsPerPage, totalItems, paginatedContents)}
                <Table
                    bind:this={table}
                    class="my-4"
                    enableSelectAll={true}
                    columns={myWorkColumns}
                    items={paginatedContents}
                    idColumn="id"
                    itemUrlPrefix="/resources/"
                    bind:searchParams={$searchParams}
                    bind:selectedItems={selectedMyWorkContents}
                    noItemsText="Your work is all done!"
                    searchable={true}
                    searchText={search}
                    noItemsAfterSearchText="No items found"
                    {totalItems}
                    {customItemsPerPage}
                    bind:itemsPerPage={pageLimit}
                    bind:currentPage={$searchParams.pageNumber}
                >
                    {#snippet tableCells(item, href, itemKey)}
                        {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                            <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
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
            {/snippet}
        </PaginatedTableWrapper>
    {:else if $searchParams.tab === Tab.myHistory}
        <PaginatedTableWrapper
            bind:pageLimit
            sortedContents={sortedMyHistoryContents}
            bind:currentPage={$searchParams.pageNumber}
        >
            {#snippet paginatedTable(customItemsPerPage, totalItems, paginatedContents)}
                <Table
                    bind:this={table}
                    class="my-4"
                    columns={myHistoryColumns}
                    items={paginatedContents as ResourceAssignedToSelfHistory[]}
                    idColumn="id"
                    itemUrlPrefix="/resources/"
                    bind:searchParams={$searchParams}
                    noItemsText="No history items"
                    searchable={true}
                    searchText={search}
                    noItemsAfterSearchText="No items found"
                    {totalItems}
                    {customItemsPerPage}
                    bind:itemsPerPage={pageLimit}
                    bind:currentPage={$searchParams.pageNumber}
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
            {/snippet}
        </PaginatedTableWrapper>
    {:else if $searchParams.tab === Tab.notifications}
        <Table
            bind:this={table}
            class="my-4"
            idColumn="id"
            enableSelectAll={true}
            columns={notificationsContentColumns}
            items={visibleNotificationContents}
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
                            <TableCell
                                ><div class="flex flex-col">
                                    <div>
                                        {notificationItem['title']} - {notificationItem['parentResourceDisplayName']}
                                    </div>
                                    <div>{@html notificationItem['notification']}</div>
                                </div>
                            </TableCell>
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

<Modal
    {isTransacting}
    primaryButtonText={'Assign'}
    primaryButtonOnClick={() => updateContent(assignEditor)}
    primaryButtonDisabled={!assignToUserId}
    bind:open={isAssignContentModalOpen}
    header="Select a User"
>
    <UserSelector users={editorsThatCanBeAssigned()} defaultLabel="Select User" bind:selectedUserId={assignToUserId} />
</Modal>

<Modal
    {isTransacting}
    primaryButtonText={'Send to Review'}
    primaryButtonOnClick={() => updateContent(sendForCompanyReview)}
    bind:open={isSendToReviewModalOpen}
    header="Confirm Send to Review"
>
    <div class="my-4 text-xl">Have you completed your editing? Your assignment will be removed.</div>
</Modal>

<Modal
    {isTransacting}
    primaryButtonText={'Send to Publisher'}
    primaryButtonOnClick={() => updateContent(sendForPublisherReview)}
    bind:open={isSendToPublisherModalOpen}
    header={'Confirm Send to Publisher'}
>
    <div class="my-4 text-xl">Have you completed your editing? Your assignment will be removed.</div>
</Modal>

<Modal header="Error" bind:description={errorModalText} isError={true} />

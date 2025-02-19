<script lang="ts">
    import type { PageData } from './$types';
    import { searchParameters, ssp, type SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';
    import type { ResourceAssignedToOwnCompany, ResourceAssignedToSelf, UserWordCount } from './+page';
    import { _ManagerTab as Tab } from './+page';
    import { createManagerDashboardSorter, SortName, createUserWordCountSorter } from './dashboard-table-sorters';
    import Select from '$lib/components/Select.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import type { BasicUser } from '$lib/types/base';
    import UserSelector from '../resources/[resourceContentId]/UserSelector.svelte';
    import Modal from '$lib/components/Modal.svelte';
    import { postToApi } from '$lib/utils/http-service';
    import { formatSimpleDaysAgo } from '$lib/utils/date-time';
    import { log } from '$lib/logger';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { filterBoolean, filterDuplicatesByKey, sortByKey } from '$lib/utils/array';
    import Table from '$lib/components/Table.svelte';
    import {
        assignedContentsColumns,
        toAssignContentsColumns,
        manageContentsColumns,
        userWordCountColumns,
    } from './manager-dashboard-columns';
    import { untrack } from 'svelte';
    import { Icon } from 'svelte-awesome';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import {
        notificationsContentColumns,
        markNotificationAsReadAndGoToResourcePage,
        markAllSelectedNotificationsAsRead,
    } from './notifications-helpers';
    import type { FlattenedNotificationsContent } from './proxy+page';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let manageContents = $derived(data.managerDashboard!.manageResourceContent);
    let toAssignContents = $derived(data.managerDashboard!.toAssignContent);
    let myWorkContents = $derived(data.managerDashboard!.assignedResourceContent);
    let flattenedNotificationContents = $derived(data.managerDashboard!.flattenedNotificationsContent);
    let userWordCounts = $derived(data.managerDashboard!.assignedUsersWordCount);

    let myWorkProjectNames = $derived.by(() =>
        Array.from(new Set(filterBoolean(myWorkContents.map((c) => c.projectName)))).sort()
    );
    let myWorkLastAssignedUsers = $derived.by(() =>
        sortByKey('name', filterDuplicatesByKey('id', filterBoolean(myWorkContents.map((c) => c.lastAssignedUser))))
    );

    let toAssignProjectNames = $derived.by(() =>
        Array.from(new Set(filterBoolean(toAssignContents.map((c) => c.projectName)))).sort()
    );

    let manageProjectNames = $derived.by(() =>
        Array.from(new Set(filterBoolean(manageContents.map((c) => c.projectName)))).sort()
    );
    let manageLastAssignedUsers = $derived.by(() =>
        sortByKey('name', filterDuplicatesByKey('id', filterBoolean(manageContents.map((c) => c.lastAssignedUser))))
    );

    $effect(() => {
        maybeResetSearchParams(
            toAssignProjectNames,
            manageProjectNames,
            myWorkProjectNames,
            manageLastAssignedUsers,
            myWorkLastAssignedUsers
        );
    });

    let search = $state('');

    const sortAssignedData = createManagerDashboardSorter<ResourceAssignedToSelf>();
    const sortManageData = createManagerDashboardSorter<ResourceAssignedToOwnCompany>();
    const sortUserWordCountData = createUserWordCountSorter();
    const sortAndFilterManageData = (
        list: ResourceAssignedToOwnCompany[],
        params: SubscribedSearchParams<typeof searchParams>
    ) => {
        if (params.assignedUserId === 0) {
            return sortManageData(list, params.sort);
        }
        return sortManageData(
            list.filter((r) => r.assignedUser.id === params.assignedUserId),
            params.sort
        );
    };

    const searchParams = searchParameters(
        {
            sort: ssp.string(SortName.Days),
            tab: ssp.string(Tab.myWork),
            assignedUserId: ssp.number(0),
            project: ssp.string(''),
            lastAssignedId: ssp.number(0),
            isFilteringUnresolved: ssp.boolean(false),
            isShowingOnlyUnread: ssp.boolean(false),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    let userWordCountParams = $state({
        sort: SortName.User,
    });

    let assignToEditorUserId: number | null = $state(null);
    let assignToReviewerUserId: number | null = $state(null);
    let isAssignContentModalOpen = $state(false);
    let isSendToPublisherModalOpen = $state(false);
    let isErrorModalOpen = $state(false);
    let isAssigning = $state(false);

    let customErrorMessage = $derived.by(() => {
        if (!isErrorModalOpen) {
            return null;
        }
    });

    let currentMyWorkContents: ResourceAssignedToSelf[] = $state([]);
    let selectedMyWorkContents: ResourceAssignedToSelf[] = $state([]);

    let currentToAssignContents: ResourceAssignedToSelf[] = $state([]);
    let selectedToAssignContents: ResourceAssignedToSelf[] = $state([]);

    let currentManageContents: ResourceAssignedToOwnCompany[] = $state([]);
    let selectedManageContents: ResourceAssignedToOwnCompany[] = $state([]);

    let currentNotifications: FlattenedNotificationsContent[] = $state([]);
    let selectedNotifications: FlattenedNotificationsContent[] = $state([]);

    let isSkipEditor = $state(false);

    let sortedCurrentMyWorkContents = $derived(sortAssignedData(currentMyWorkContents, $searchParams.sort));
    let sortedCurrentToAssignContents = $derived(sortAssignedData(currentToAssignContents, $searchParams.sort));
    let sortedUserWordCounts = $derived(sortUserWordCountData(userWordCounts, userWordCountParams.sort));
    let sortedCurrentManageContents = $derived(sortAndFilterManageData(currentManageContents, $searchParams));

    const setTabContents = (
        tab: string,
        assignedUserId: number,
        toAssignProjectName: string,
        lastAssignedId: number,
        search: string,
        isFilteringUnresolved: boolean,
        isShowingOnlyUnread: boolean
    ) => {
        if (tab === Tab.myWork) {
            currentMyWorkContents = myWorkContents.filter(
                (x) =>
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (toAssignProjectName === '' || x.projectName === toAssignProjectName) &&
                    (lastAssignedId === 0 || x.lastAssignedUser?.id === lastAssignedId) &&
                    (!isFilteringUnresolved || x.hasUnresolvedCommentThreads === true)
            );
        } else if (tab === Tab.toAssign) {
            currentToAssignContents = toAssignContents.filter(
                (x) =>
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (toAssignProjectName === '' || x.projectName === toAssignProjectName)
            );
        } else if (tab === Tab.manage) {
            currentManageContents = manageContents.filter(
                (x) =>
                    (assignedUserId === 0 || x.assignedUser.id === assignedUserId) &&
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (toAssignProjectName === '' || x.projectName === toAssignProjectName) &&
                    (lastAssignedId === 0 || x.lastAssignedUser?.id === lastAssignedId) &&
                    (!isFilteringUnresolved || x.hasUnresolvedCommentThreads === true)
            );
        } else if (tab === Tab.notifications) {
            currentNotifications = flattenedNotificationContents.filter((n) => {
                if (isShowingOnlyUnread) {
                    return !n.isRead;
                } else {
                    return true;
                }
            });
        }
    };

    $effect(() =>
        setTabContents(
            $searchParams.tab,
            $searchParams.assignedUserId,
            $searchParams.project,
            $searchParams.lastAssignedId,
            search,
            $searchParams.isFilteringUnresolved,
            $searchParams.isShowingOnlyUnread
        )
    );
    let anyRowSelected = $derived(
        selectedMyWorkContents.length > 0 || selectedToAssignContents.length > 0 || selectedManageContents.length > 0
    );
    let nonCompanyReviewSelected = $derived.by(() =>
        selectedMyWorkContents.some(
            (x) =>
                ![
                    ResourceContentStatusEnum.AquiferizeCompanyReview,
                    ResourceContentStatusEnum.TranslationCompanyReview,
                ].includes(x.statusValue)
        )
    );

    function maybeResetSearchParams(
        toAssignProjectNames: string[],
        manageProjectNames: string[],
        myWorkProjectNames: string[],
        manageLastAssignedUsers: BasicUser[],
        myWorkLastAssignedUsers: BasicUser[]
    ) {
        // Handle situation where project is set in the searchParams but is no longer valid. E.g. saved bookmark
        // or forced refresh after assign that removed all of them.
        if (
            (untrack(() => $searchParams.tab) === Tab.toAssign &&
                !toAssignProjectNames.includes(untrack(() => $searchParams.project))) ||
            (untrack(() => $searchParams.tab === Tab.manage) &&
                !manageProjectNames.includes(untrack(() => $searchParams.project))) ||
            (untrack(() => $searchParams.tab === Tab.myWork) &&
                !myWorkProjectNames.includes(untrack(() => $searchParams.project)))
        ) {
            untrack(() => ($searchParams.project = ''));
        }
        if (
            (untrack(() => $searchParams.tab === Tab.manage) &&
                manageLastAssignedUsers.filter((u) => u.id === untrack(() => $searchParams.lastAssignedId)).length ===
                    0) ||
            (untrack(() => $searchParams.tab === Tab.myWork) &&
                myWorkLastAssignedUsers.filter((u) => u.id === untrack(() => $searchParams.lastAssignedId)).length ===
                    0)
        ) {
            untrack(() => ($searchParams.lastAssignedId = 0));
        }
    }

    function toggleSkipEditor() {
        isSkipEditor = !isSkipEditor;
    }

    let currentProjectNames = $derived.by(() => {
        if ($searchParams.tab === Tab.myWork) {
            return myWorkProjectNames;
        } else if ($searchParams.tab === Tab.toAssign) {
            return toAssignProjectNames;
        } else if ($searchParams.tab === Tab.manage) {
            return manageProjectNames;
        }
        return [];
    });

    let currentLastAssignedUsers = $derived.by(() => {
        if ($searchParams.tab === Tab.myWork) {
            return myWorkLastAssignedUsers;
        } else if ($searchParams.tab === Tab.manage) {
            return manageLastAssignedUsers;
        }
        return [];
    });

    const switchTabs = (tab: Tab) => {
        if ($searchParams.tab === tab) return;

        $searchParams.tab = tab;
        $searchParams.assignedUserId = 0;
        $searchParams.lastAssignedId = 0;

        $searchParams.project = '';
        resetSelections();
    };

    const resetSelections = () => {
        selectedMyWorkContents = [];
        selectedToAssignContents = [];
        selectedManageContents = [];
    };

    const assignEditor = async (contentIds: number[]) => {
        if (contentIds.length > 0) {
            await postToApi<null>('/resources/content/send-for-editor-review', {
                assignedUserId: isSkipEditor ? assignToReviewerUserId : assignToEditorUserId,
                assignedReviewerUserId: isSkipEditor ? null : assignToReviewerUserId,
                contentIds: contentIds,
                skipEditorStep: isSkipEditor,
            });
        }
    };

    const sendForReview = async (contentIds: number[]) => {
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

    async function updateContent(action: (contentIds: number[]) => Promise<void>) {
        isAssigning = true;

        try {
            const contentIds = [
                ...selectedMyWorkContents.map((x) => x.id),
                ...selectedToAssignContents.map((x) => x.id),
                ...selectedManageContents.map((x) => x.id),
            ];
            await action(contentIds);
            isAssigning = false;
            window.location.reload();
        } catch {
            isErrorModalOpen = true;
            isAssigning = false;
        }
    }

    let table:
        | Table<ResourceAssignedToSelf>
        | Table<ResourceAssignedToOwnCompany>
        | Table<FlattenedNotificationsContent>
        | undefined = $state(undefined);
    let userWordCountTable: Table<UserWordCount> | undefined = $state(undefined);

    $effect(() => {
        if (userWordCountParams.sort && userWordCountTable) {
            untrack(() => userWordCountTable?.resetScroll());
        }
    });
    $effect(() => {
        if ($searchParams.sort && $searchParams.tab && table) {
            untrack(() => table?.resetScroll());
        }
    });

    let selectedCount = $state(0);
    let selectedWordCount = $state(0);

    function calculateSelectedCounts(
        selectedMyWorkContents: ResourceAssignedToSelf[],
        selectedToAssignContents: ResourceAssignedToSelf[],
        selectedManageContents: ResourceAssignedToOwnCompany[]
    ) {
        if ($searchParams.tab === Tab.myWork) {
            selectedCount = selectedMyWorkContents.length;
            selectedWordCount = selectedMyWorkContents.reduce((acc, x) => acc + (x.wordCount ?? 0), 0);
        } else if ($searchParams.tab === Tab.toAssign) {
            selectedCount = selectedToAssignContents.length;
            selectedWordCount = selectedToAssignContents.reduce((acc, x) => acc + (x.wordCount ?? 0), 0);
        } else if ($searchParams.tab === Tab.manage) {
            selectedCount = selectedManageContents.length;
            selectedWordCount = selectedManageContents.reduce((acc, x) => acc + (x.wordCount ?? 0), 0);
        }
    }

    $effect(() => calculateSelectedCounts(selectedMyWorkContents, selectedToAssignContents, selectedManageContents));
</script>

<div class="flex flex-col overflow-y-hidden px-4">
    <h1 class="pt-4 text-3xl">Dashboard</h1>
    <div class="flex flex-row items-center pt-4">
        <div role="tablist" class="tabs tabs-bordered w-fit">
            <button
                onclick={() => switchTabs(Tab.myWork)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}">My Work ({myWorkContents.length})</button
            >
            <button
                onclick={() => switchTabs(Tab.toAssign)}
                role="tab"
                class="tab {$searchParams.tab === Tab.toAssign && 'tab-active'}"
                >To Assign ({toAssignContents.length})</button
            >
            <button
                onclick={() => switchTabs(Tab.manage)}
                role="tab"
                class="tab {$searchParams.tab === Tab.manage && 'tab-active'}">Manage ({manageContents.length})</button
            >
            <button
                onclick={() => switchTabs(Tab.notifications)}
                role="tab"
                class="tab {$searchParams.tab === Tab.notifications && 'tab-active'}"
                >Notifications ({flattenedNotificationContents.filter((n) => !n.isRead).length})</button
            >
        </div>
    </div>
    <div class="mt-4 flex gap-4">
        {#if $searchParams.tab !== Tab.notifications}
            <input class="input input-bordered max-w-xs focus:outline-none" bind:value={search} placeholder="Search" />
            <Select
                class="select select-bordered max-w-[14rem] flex-grow"
                bind:value={$searchParams.project}
                onChange={resetSelections}
                isNumber={false}
                options={[{ value: '', label: 'Project' }, ...currentProjectNames.map((p) => ({ value: p, label: p }))]}
            />
            {#if $searchParams.tab === Tab.manage || $searchParams.tab === Tab.myWork}
                <Select
                    class="select select-bordered max-w-[14rem] flex-grow"
                    bind:value={$searchParams.lastAssignedId}
                    onChange={resetSelections}
                    isNumber={true}
                    options={[
                        { value: 0, label: 'Last Assigned' },
                        ...currentLastAssignedUsers.map((n) => ({ value: n.id, label: n.name })),
                    ]}
                />
            {/if}
            {#if $searchParams.tab === Tab.manage}
                <Select
                    class="select select-bordered max-w-[14rem] flex-grow"
                    bind:value={$searchParams.assignedUserId}
                    onChange={resetSelections}
                    isNumber={true}
                    options={[
                        { value: 0, label: 'Assigned' },
                        ...(data.users || []).map((u) => ({ value: u.id, label: u.name })),
                    ]}
                />
            {/if}

            {#if $searchParams.tab === Tab.manage || $searchParams.tab === Tab.myWork}
                <label class="label cursor-pointer py-0 opacity-70">
                    <input
                        type="checkbox"
                        bind:checked={$searchParams.isFilteringUnresolved}
                        data-app-insights-event-name="manager-dashboard-has-unresolved-comments-toggle-{$searchParams.isFilteringUnresolved
                            ? 'off'
                            : 'on'}"
                        class="checkbox no-animation checkbox-sm me-2"
                    />
                    <span class="label-text text-xs">Has Unresolved Comments</span>
                </label>
            {/if}

            <button
                data-app-insights-event-name="manager-dashboard-bulk-assign-click"
                class="btn btn-primary"
                onclick={() => (isAssignContentModalOpen = true)}
                disabled={selectedMyWorkContents.length === 0 &&
                    selectedToAssignContents.length === 0 &&
                    selectedManageContents.length === 0}>Assign</button
            >

            {#if $searchParams.tab === Tab.myWork}
                <Tooltip
                    position={{ left: '10rem' }}
                    text={nonCompanyReviewSelected ? 'Company Review status only' : null}
                >
                    <button
                        data-app-insights-event-name="manager-dashboard-bulk-assign-click"
                        class="btn btn-primary"
                        onclick={() => (isSendToPublisherModalOpen = true)}
                        disabled={!anyRowSelected || nonCompanyReviewSelected}>Send to Publisher</button
                    >
                </Tooltip>
            {/if}
            <div class="my-1 ml-auto flex flex-col items-end justify-center">
                <div class="text-sm text-gray-500">Selected Items: {selectedCount ?? 0}</div>
                <div class="text-sm text-gray-500">Selected Word Count: {selectedWordCount ?? 0}</div>
            </div>
        {:else}
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

    {#if $searchParams.tab === Tab.myWork}
        <Table
            bind:this={table}
            class="my-4"
            enableSelectAll={true}
            columns={assignedContentsColumns}
            items={sortedCurrentMyWorkContents}
            itemUrlPrefix="/resources/"
            idColumn="id"
            bind:searchParams={$searchParams}
            bind:selectedItems={selectedMyWorkContents}
            noItemsText="Your work is all done!"
            searchable={true}
            bind:searchText={search}
        >
            {#snippet tableCells(item, href, itemKey)}
                {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                    <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
                {:else if itemKey === 'daysUntilProjectDeadline' && item[itemKey] !== null}
                    <LinkedTableCell {href} class={(item[itemKey] ?? 0) < 0 ? 'text-error' : ''}
                        >{item[itemKey] ?? ''}</LinkedTableCell
                    >
                {:else if itemKey === 'lastAssignedUser'}
                    <LinkedTableCell {href}>{item[itemKey]?.name ?? ''}</LinkedTableCell>
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
    {:else if $searchParams.tab === Tab.toAssign}
        <div class="flex h-full flex-[2] grow flex-col gap-4 overflow-y-hidden xl:flex-row">
            <Table
                bind:this={table}
                class="my-4 max-h-[31.25rem] xl:grow"
                enableSelectAll={true}
                columns={toAssignContentsColumns}
                items={sortedCurrentToAssignContents}
                idColumn="id"
                bind:searchParams={$searchParams}
                bind:selectedItems={selectedToAssignContents}
                itemUrlPrefix="/resources/"
                noItemsText="Your work is all done!"
                searchable={true}
                bind:searchText={search}
            >
                {#snippet tableCells(item, href, itemKey)}
                    {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                        <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
                    {:else if itemKey === 'daysUntilProjectDeadline' && item[itemKey] !== null}
                        <LinkedTableCell {href} class={(item[itemKey] ?? 0) < 0 ? 'text-error' : ''}
                            >{item[itemKey] ?? ''}</LinkedTableCell
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
            {#if userWordCounts.length > 0}
                <Table
                    bind:this={userWordCountTable}
                    class="my-4 w-full xl:max-w-[275px]"
                    columns={userWordCountColumns}
                    items={sortedUserWordCounts}
                    idColumn="userId"
                    noItemsText="No Users Found."
                    bind:searchParams={userWordCountParams}
                ></Table>
            {/if}
        </div>
    {:else if $searchParams.tab === Tab.manage}
        <div class="flex h-full flex-[2] grow flex-col gap-4 overflow-y-hidden xl:flex-row">
            <Table
                bind:this={table}
                class="my-4 max-h-[31.25rem] xl:grow"
                enableSelectAll={true}
                columns={manageContentsColumns}
                items={sortedCurrentManageContents}
                idColumn="id"
                bind:searchParams={$searchParams}
                bind:selectedItems={selectedManageContents}
                itemUrlPrefix="/resources/"
                noItemsText={$searchParams.assignedUserId === 0
                    ? 'Your work is all done!'
                    : 'Nothing assigned to this user.'}
                searchable={true}
                bind:searchText={search}
            >
                {#snippet tableCells(item, href, itemKey)}
                    {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                        <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
                    {:else if (itemKey === 'assignedUser' || itemKey === 'assignedReviewerUser') && item[itemKey] !== null && item[itemKey]?.name !== null}
                        <LinkedTableCell {href}>{item[itemKey]?.name}</LinkedTableCell>
                    {:else if itemKey === 'daysUntilProjectDeadline' && item[itemKey] !== null}
                        <LinkedTableCell {href} class={(item[itemKey] ?? 0) < 0 ? 'text-error' : ''}
                            >{item[itemKey] ?? ''}</LinkedTableCell
                        >
                    {:else if itemKey === 'lastAssignedUser'}
                        <LinkedTableCell {href}>{item[itemKey]?.name ?? ''}</LinkedTableCell>
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
            {#if userWordCounts.length > 0}
                <Table
                    bind:this={userWordCountTable}
                    class="my-4 w-full xl:max-w-[275px]"
                    columns={userWordCountColumns}
                    items={sortedUserWordCounts}
                    idColumn="userId"
                    noItemsText="No Users Found."
                    bind:searchParams={userWordCountParams}
                ></Table>
            {/if}
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
                            <TableCell
                                ><div class="flex flex-col">
                                    <div>
                                        {notificationItem['title']} - {notificationItem['parentResourceDisplayName']}
                                    </div>
                                    <div>{notificationItem['notification']}</div>
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
    isTransacting={isAssigning}
    primaryButtonText={'Assign'}
    primaryButtonOnClick={() => updateContent(assignEditor)}
    primaryButtonDisabled={isSkipEditor ? !assignToReviewerUserId : !assignToEditorUserId}
    bind:open={isAssignContentModalOpen}
    header={'Assign Resource(s)'}
>
    <h3 class="my-4 text-xl">
        Editor
        {#if !isSkipEditor}
            <span class="text-error">*</span>
        {/if}
    </h3>
    <UserSelector
        users={data.users?.filter((u) => u.role !== UserRole.ReportViewer) ?? []}
        defaultLabel="Select Editor"
        bind:disabled={isSkipEditor}
        bind:selectedUserId={assignToEditorUserId}
    />

    {#if $searchParams.tab === Tab.toAssign}
        <label class="label mt-5 cursor-pointer justify-start">
            <input
                type="checkbox"
                class="checkbox checkbox-sm"
                onclick={toggleSkipEditor}
                checked={isSkipEditor}
                aria-label="Skip Editor Step"
            />
            <span class="label-text pl-2 text-xs text-opacity-70">Skip Editor Step</span>
        </label>
        <h3 class="my-4 text-xl">
            Reviewer
            {#if isSkipEditor}
                <span class="text-error">*</span>
            {/if}
        </h3>
        <UserSelector
            users={data.users?.filter((u) => u.role === UserRole.Reviewer || u.role === UserRole.Manager) ?? []}
            defaultLabel="Select Reviewer"
            bind:selectedUserId={assignToReviewerUserId}
        />
    {/if}
</Modal>

<Modal
    isTransacting={isAssigning}
    primaryButtonText={'Send to Publisher'}
    primaryButtonOnClick={() => updateContent(sendForReview)}
    bind:open={isSendToPublisherModalOpen}
    header={'Confirm Send to Publisher'}
>
    <div class="my-4 text-xl">Have you completed your editing? Your assignment will be removed.</div>
</Modal>

<Modal
    header="Error"
    bind:open={isErrorModalOpen}
    isError={true}
    description={customErrorMessage || 'Error while assigning content.'}
/>

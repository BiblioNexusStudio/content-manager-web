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

    const sortMyWorkData = createEditorDashboardMyWorkSorter();
    const sortMyHistoryData = createEditorDashboardMyHistorySorter();

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let myWorkContents = data.editorDashboard!.assignedResourceContent;
    let myHistoryContents = data.editorDashboard!.assignedResourceHistoryContent;
    let isAssignContentModalOpen = $state(false);
    let isSendToPublisherModalOpen = $state(false);
    let isSendToReviewModalOpen = $state(false);

    let selectedMyWorkContents: ResourceAssignedToSelf[] = $state([]);
    let isTransacting = $state(false);
    let assignToUserId: number | null = $state(null);
    let errorModalText: string | undefined = $state(undefined);
    let isReviewer = $derived($userCan(Permission.SendReviewContent));
    let isAssignOrSendToReviewButtonDisabled = $derived(() => selectedMyWorkContents.length === 0);
    let isSendToPublisherButtonDisabled = $derived(
        () =>
            selectedMyWorkContents.length === 0 ||
            !selectedMyWorkContents.every((x) => x.statusValue === ResourceContentStatusEnum.TranslationCompanyReview)
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
        },
        { runLoadAgainWhenParamsChange: false }
    );

    const setTabContents = (tab: string, search: string, project: string, isFilteringUnresolved: boolean) => {
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
    let sortedMyWorkContents: ResourceAssignedToSelf[] = $derived(
        sortMyWorkData(visibleMyWorkContents, $searchParams.sort)
    );
    let sortedMyHistoryContents: ResourceAssignedToSelfHistory[] = $derived(
        sortMyHistoryData(visibleMyHistoryContents, $searchParams.sort)
    );
    let table: Table<ResourceAssignedToSelfHistory> | Table<ResourceAssignedToSelf> | undefined = $state(undefined);

    $effect(() => {
        if ($searchParams.sort && table !== undefined) {
            untrack(() => table?.resetScroll());
        }
    });

    $effect(() => {
        setTabContents($searchParams.tab, search, $searchParams.project, $searchParams.isFilteringUnresolved);
    });

    function projectNamesForContents(contents: ResourceAssignedToSelf[]) {
        return Array.from(new Set(filterBoolean(contents.map((c) => c.projectName)))).sort();
    }
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
                onclick={() => switchTabs(Tab.myHistory)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myHistory && 'tab-active'}"
                >My History ({myHistoryContents.length})</button
            >
        </div>
    </div>
    <div class="mt-4 flex gap-4">
        <input class="input input-bordered max-w-xs focus:outline-none" bind:value={search} placeholder="Search" />
        {#if $searchParams.tab === Tab.myWork}
            <Select
                class="select select-bordered max-w-[14rem] flex-grow"
                bind:value={$searchParams.project}
                options={[
                    { value: '', label: 'Project' },
                    ...projectNamesForContents(myWorkContents).map((p) => ({ value: p, label: p })),
                ]}
            />
            <label class="label cursor-pointer py-0 opacity-70">
                <input
                    type="checkbox"
                    bind:checked={$searchParams.isFilteringUnresolved}
                    data-app-insights-event-name="editor-dashboard-has-unresolved-comments-toggle-{$searchParams.isFilteringUnresolved
                        ? 'off'
                        : 'on'}"
                    class="checkbox no-animation checkbox-sm me-2"
                />
                <span class="label-text text-xs">Has Unresolved Comments</span>
            </label>
        {/if}
        {#if $searchParams.tab === Tab.myWork}
            <button
                data-app-insights-event-name="editor-dashboard-bulk-assign-click"
                class="btn btn-primary"
                onclick={() => (isAssignContentModalOpen = true)}
                disabled={isAssignOrSendToReviewButtonDisabled()}
                >Assign
            </button>
        {/if}
        {#if $searchParams.tab === Tab.myWork && !isReviewer}
            <button
                data-app-insights-event-name="editor-dashboard-bulk-send-to-review-click"
                class="btn btn-primary"
                onclick={() => (isSendToReviewModalOpen = true)}
                disabled={isAssignOrSendToReviewButtonDisabled()}
                >Send to Review
            </button>
        {/if}
        {#if $searchParams.tab === Tab.myWork && isReviewer}
            <button
                data-app-insights-event-name="editor-dashboard-bulk-send-to-publisher-click"
                class="btn btn-primary"
                onclick={() => (isSendToPublisherModalOpen = true)}
                disabled={isSendToPublisherButtonDisabled()}
                >Send to Publisher
            </button>
        {/if}
        {#if $searchParams.tab === Tab.myWork}
            <div class="my-1 ml-auto flex flex-col items-end justify-center">
                <div class="text-sm text-gray-500">Total Items: {visibleMyWorkContents.length}</div>
                <div class="text-sm text-gray-500">
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
    </div>
    {#if $searchParams.tab === Tab.myWork}
        <Table
            bind:this={table}
            class="my-4"
            enableSelectAll={true}
            columns={myWorkColumns}
            items={sortedMyWorkContents as ResourceAssignedToSelf[]}
            idColumn="id"
            itemUrlPrefix="/resources/"
            bind:searchParams={$searchParams}
            bind:selectedItems={selectedMyWorkContents}
            noItemsText="Your work is all done!"
            searchable={true}
            searchText={search}
            noItemsAfterSearchText="No items found"
        >
            {#snippet tableCells(item, href, itemKey)}
                {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                    <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
                {:else if href !== undefined && itemKey}
                    <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                {:else if itemKey}
                    <TableCell>{item[itemKey] ?? ''}</TableCell>
                {/if}
            {/snippet}
        </Table>
    {:else if $searchParams.tab === Tab.myHistory}
        <Table
            bind:this={table}
            class="my-4"
            columns={myHistoryColumns}
            items={sortedMyHistoryContents as ResourceAssignedToSelfHistory[]}
            idColumn="id"
            itemUrlPrefix="/resources/"
            bind:searchParams={$searchParams}
            noItemsText="No history items"
            searchable={true}
            searchText={search}
            noItemsAfterSearchText="No items found"
        >
            {#snippet tableCells(item, href, itemKey)}
                {#if itemKey === 'lastActionTime' && item[itemKey] !== null}
                    <LinkedTableCell {href}
                        >{utcDateTimeStringToDateTime(item[itemKey]).toLocaleDateString()}</LinkedTableCell
                    >
                {:else if href !== undefined && itemKey}
                    <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                {:else if itemKey}
                    <TableCell>{item[itemKey] ?? ''}</TableCell>
                {/if}
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

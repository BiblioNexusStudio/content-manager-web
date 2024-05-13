<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp, type SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';
    import type { ResourceAssignedToOwnCompany, ResourceAssignedToSelf } from './+page';
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import { createListSorter } from '$lib/utils/sorting';
    import Select from '$lib/components/Select.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import UserSelector from './resources/[resourceContentId]/UserSelector.svelte';
    import Modal from '$lib/components/Modal.svelte';
    import { postToApi } from '$lib/utils/http-service';

    export let data: PageData;

    enum Tab {
        myWork = 'my-work',
        toAssign = 'to-assign',
        manage = 'manage',
    }

    const SORT_KEYS = {
        days: 'days',
        wordCount: 'word-count',
    };

    const sortAssignedData = createListSorter<ResourceAssignedToSelf>({
        [SORT_KEYS.days]: 'daysUntilProjectDeadline',
        [SORT_KEYS.wordCount]: 'wordCount',
    });

    const sortManageData = createListSorter<ResourceAssignedToOwnCompany>({
        [SORT_KEYS.days]: 'daysUntilProjectDeadline',
        [SORT_KEYS.wordCount]: 'wordCount',
    });

    const searchParams = searchParameters({
        sort: ssp.string('-' + SORT_KEYS.days),
        tab: ssp.string(Tab.myWork),
        assignedUserId: ssp.number(0),
    });

    const getInReviewStatus = (status: ResourceContentStatusEnum) =>
        [
            ResourceContentStatusEnum.AquiferizeInReview,
            ResourceContentStatusEnum.AquiferizeReviewPending,
            ResourceContentStatusEnum.TranslationInReview,
            ResourceContentStatusEnum.TranslationReviewPending,
        ].includes(status);

    let assignToUserId: number | null = null;
    let isAssignContentModalOpen = false;
    let isErrorModalOpen = false;
    let isAssigning = false;

    let myWorkContents: ResourceAssignedToSelf[] = [];
    let toAssignContents: ResourceAssignedToSelf[] = [];
    let manageContents: ResourceAssignedToOwnCompany[] = [];

    const getTabContents = (tab: string) => {
        if (tab === Tab.myWork) {
            console.log(myWorkContents);
            return myWorkContents;
        } else if (tab === Tab.toAssign) {
            return toAssignContents;
        } else if (tab === Tab.manage) {
            return manageContents;
        }

        return [];
    };

    $: allTabContents = getTabContents($searchParams.tab);
    $: anyRowSelected = allTabContents.some((x) => x.rowSelected);
    $: allRowsSelected = allTabContents.every((x) => x.rowSelected);
    $: anyInReviewSelected = allTabContents.some((x) => x.rowSelected && getInReviewStatus(x.statusValue));
    $: $searchParams.tab && resetSelection();

    const loadContents = async () => {
        const manageContentsPromise = data.managerDashboard!.manageResourceContent.promise;
        const toAssignContentsPromise = data.managerDashboard!.toAssignContent.promise;
        const assignedContentsPromise = data.managerDashboard!.assignedResourceContent.promise;

        [myWorkContents, toAssignContents, manageContents] = await Promise.all([
            assignedContentsPromise,
            toAssignContentsPromise,
            manageContentsPromise,
        ]);
    };

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

    function toggleResourceSelection(contentId: number, status: ResourceContentStatusEnum | null = null) {
        return () => {
            // status === null ||
            // status === ResourceContentStatusEnum.New ||
            // status === ResourceContentStatusEnum.TranslationNotStarted ||
            // status === ResourceContentStatusEnum.AquiferizeInProgress ||
            // status === ResourceContentStatusEnum.TranslationInProgress
        };
    }

    function onSelectAll(tab: string) {
        if (tab === Tab.myWork) {
            const allSelected = myWorkContents.every((x) => x.rowSelected);
            for (const content of myWorkContents) {
                content.rowSelected = !allSelected;
            }
        } else if (tab === Tab.toAssign) {
            const allSelected = toAssignContents.every((x) => x.rowSelected);
            for (const content of toAssignContents) {
                content.rowSelected = !allSelected;
            }
        } else if (tab === Tab.manage) {
            const allSelected = manageContents.every((x) => x.rowSelected);
            for (const content of manageContents) {
                content.rowSelected = !allSelected;
            }
        }
    }

    function resetSelection() {
        console.log('reset called');
        for (const content of allTabContents) {
            content.rowSelected = false;
        }
    }

    const assignEditor = async () => {};

    const assignReviewer = async () => {};

    async function assignContent() {
        // isAssigning = true;
        // const inProgessAssignments =
        //     selectedInProgressContentIds.length > 0
        //         ? postToApi<null>('/resources/content/assign-editor', {
        //               assignedUserId: assignToUserId,
        //               contentIds: selectedInProgressContentIds,
        //           })
        //         : Promise.resolve(null);
        // const inReviewAssignments =
        //     selectedReviewContentIds.length > 0
        //         ? postToApi<null>('/resources/content/assign-review', {
        //               assignedUserId: assignToUserId,
        //               contentIds: selectedReviewContentIds,
        //           })
        //         : Promise.resolve(null);
        //
        // try {
        //     await Promise.all([inProgessAssignments, inReviewAssignments]);
        //     isAssigning = false;
        //     window.location.reload();
        // } catch {
        //     isErrorModalOpen = true;
        //     isAssigning = false;
        // }
    }

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);
</script>

{#await loadContents()}
    <CenteredSpinner />
{:then _}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Manager Dashboard</h1>
        <div class="flex flex-row items-center pt-4">
            <div role="tablist" class="tabs tabs-bordered w-fit">
                <button
                    on:click={() => ($searchParams.tab = Tab.myWork)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}"
                    >My Work ({myWorkContents.length})</button
                >
                <button
                    on:click={() => ($searchParams.tab = Tab.toAssign)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.toAssign && 'tab-active'}"
                    >To Assign ({toAssignContents.length})</button
                >
                <button
                    on:click={() => ($searchParams.tab = Tab.manage)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.manage && 'tab-active'}"
                    >Manage ({manageContents.length})</button
                >
            </div>
        </div>
        <div class="mt-4 flex gap-4">
            {#if $searchParams.tab === Tab.manage}
                <Select
                    class="select select-bordered max-w-[14rem] flex-grow"
                    bind:value={$searchParams.assignedUserId}
                    isNumber={true}
                    options={[
                        { value: 0, label: 'Assigned' },
                        ...(data.users || []).map((u) => ({ value: u.id, label: u.name })),
                    ]}
                />
            {/if}

            <button
                data-app-insights-event-name="manager-dashboard-bulk-assign-click"
                class="btn btn-primary"
                on:click={() => (isAssignContentModalOpen = true)}
                disabled={!anyRowSelected}>Assign</button
            >
        </div>

        <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-auto">
            <table class="table table-pin-rows">
                {#if $searchParams.tab === Tab.myWork || $searchParams.tab === Tab.toAssign}
                    {@const isMyWorkTab = $searchParams.tab === Tab.myWork}
                    <thead>
                        <tr class="bg-base-200">
                            <th
                                ><input
                                    bind:checked={allRowsSelected}
                                    on:click={() => onSelectAll($searchParams.tab)}
                                    type="checkbox"
                                    class="checkbox checkbox-sm"
                                /></th
                            >
                            <th>Title</th>
                            <th>Resource</th>
                            <th>Language</th>
                            <th>Project</th>
                            {#if isMyWorkTab}
                                <th>Status</th>
                            {/if}
                            <SortingTableHeaderCell
                                text="Deadline (Days)"
                                sortKey={SORT_KEYS.days}
                                bind:currentSort={$searchParams.sort}
                            />
                            <SortingTableHeaderCell
                                text="Word Count"
                                sortKey={SORT_KEYS.wordCount}
                                bind:currentSort={$searchParams.sort}
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {#each sortAssignedData(isMyWorkTab ? myWorkContents : toAssignContents, $searchParams.sort) as resource, i (resource.id)}
                            {@const href = `/resources/${resource.id}`}
                            <tr class="hover">
                                <TableCell class="w-4"
                                    ><input
                                        bind:checked={resource.rowSelected}
                                        on:change={toggleResourceSelection(resource.id, resource.statusValue)}
                                        type="checkbox"
                                        class="checkbox checkbox-sm"
                                    /></TableCell
                                >
                                <LinkedTableCell {href}>{resource.englishLabel}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.parentResourceName}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.languageEnglishDisplay}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.projectName ?? ''}</LinkedTableCell>
                                {#if isMyWorkTab}
                                    <LinkedTableCell {href}>{resource.statusDisplayName ?? ''}</LinkedTableCell>
                                {/if}
                                <LinkedTableCell
                                    {href}
                                    class={(resource.daysUntilProjectDeadline ?? 0) < 0 ? 'text-error' : ''}
                                    >{resource.daysUntilProjectDeadline ?? ''}</LinkedTableCell
                                >
                                <LinkedTableCell {href}>{resource.wordCount ?? ''}</LinkedTableCell>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="99" class="text-center">Your work is all done!</td>
                            </tr>
                        {/each}
                    </tbody>
                {:else if $searchParams.tab === Tab.manage}
                    <thead>
                        <tr class="bg-base-200">
                            <th
                                ><input
                                    bind:checked={allRowsSelected}
                                    on:click={() => onSelectAll($searchParams.tab)}
                                    type="checkbox"
                                    class="checkbox checkbox-sm"
                                /></th
                            >
                            <th>Title</th>
                            <th>Resource</th>
                            <th>Language</th>
                            <th>Project</th>
                            <th>Assigned</th>
                            <SortingTableHeaderCell
                                text="Deadline (Days)"
                                sortKey={SORT_KEYS.days}
                                bind:currentSort={$searchParams.sort}
                            />
                            <SortingTableHeaderCell
                                text="Word Count"
                                sortKey={SORT_KEYS.wordCount}
                                bind:currentSort={$searchParams.sort}
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {#each sortAndFilterManageData(manageContents, $searchParams) as resource, i (resource.id)}
                            {@const href = `/resources/${resource.id}`}
                            <tr class="hover">
                                <TableCell class="w-4"
                                    ><input
                                        bind:checked={resource.rowSelected}
                                        on:change={toggleResourceSelection(resource.id)}
                                        type="checkbox"
                                        class="checkbox checkbox-sm"
                                    /></TableCell
                                >
                                <LinkedTableCell {href}>{resource.englishLabel}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.parentResourceName}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.languageEnglishDisplay}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.projectName ?? ''}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.assignedUser.name}</LinkedTableCell>
                                <LinkedTableCell
                                    {href}
                                    class={(resource.daysUntilProjectDeadline ?? 0) < 0 ? 'text-error' : ''}
                                    >{resource.daysUntilProjectDeadline ?? ''}</LinkedTableCell
                                >
                                <LinkedTableCell {href}>{resource.wordCount ?? ''}</LinkedTableCell>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="99" class="text-center"
                                    >{$searchParams.assignedUserId === 0
                                        ? 'Your work is all done!'
                                        : 'Nothing assigned to this user.'}</td
                                >
                            </tr>
                        {/each}
                    </tbody>
                {/if}
            </table>
        </div>
    </div>
{/await}

<Modal
    isTransacting={isAssigning}
    primaryButtonText={'Assign'}
    primaryButtonOnClick={assignContent}
    primaryButtonDisabled={!assignToUserId}
    bind:open={isAssignContentModalOpen}
    header={anyInReviewSelected ? 'Choose a publisher' : 'Choose a user'}
>
    <UserSelector
        users={data.users?.filter((u) => !anyInReviewSelected || u.role === UserRole.Publisher) ?? []}
        defaultLabel="Select User"
        bind:selectedUserId={assignToUserId}
    />
</Modal>

<Modal header="Error" bind:open={isErrorModalOpen} isError={true} description="Error while assigning content." />

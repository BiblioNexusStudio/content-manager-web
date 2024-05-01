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

    function sortAndFilterManageData(
        list: ResourceAssignedToOwnCompany[],
        params: SubscribedSearchParams<typeof searchParams>
    ) {
        if (params.assignedUserId === 0) {
            return sortManageData(list, params.sort);
        }
        return sortManageData(
            list.filter((r) => r.assignedUser.id === params.assignedUserId),
            params.sort
        );
    }

    const searchParams = searchParameters({
        sort: ssp.string('-' + SORT_KEYS.days),
        tab: ssp.string(Tab.myWork),
        assignedUserId: ssp.number(0),
    });

    let selectedReviewContentIds: number[] = [];
    let selectedInProgressContentIds: number[] = [];
    let assignToUserId: number | null = null;
    let isAssignContentModalOpen = false;
    let isErrorModalOpen = false;
    let isAssigning = false;

    $: $searchParams.tab && resetSelection();

    function toggleResourceSelection(contentId: number, status: ResourceContentStatusEnum | null = null) {
        return () => {
            if (
                status === null ||
                status === ResourceContentStatusEnum.New ||
                status === ResourceContentStatusEnum.TranslationNotStarted ||
                status === ResourceContentStatusEnum.AquiferizeInProgress ||
                status === ResourceContentStatusEnum.TranslationInProgress
            ) {
                const index = selectedInProgressContentIds.indexOf(contentId);
                if (index !== -1) {
                    selectedInProgressContentIds.splice(index, 1);
                    selectedInProgressContentIds = selectedInProgressContentIds;
                } else {
                    selectedInProgressContentIds.push(contentId);
                    selectedInProgressContentIds = selectedInProgressContentIds;
                }
            } else {
                const index = selectedReviewContentIds.indexOf(contentId);
                if (index !== -1) {
                    selectedReviewContentIds.splice(index, 1);
                    selectedReviewContentIds = selectedReviewContentIds;
                } else {
                    selectedReviewContentIds.push(contentId);
                    selectedReviewContentIds = selectedReviewContentIds;
                }
            }
        };
    }

    function resetSelection() {
        selectedReviewContentIds = [];
        selectedInProgressContentIds = [];
    }

    async function assignContent() {
        isAssigning = true;
        const inProgessAssignments =
            selectedInProgressContentIds.length > 0
                ? postToApi<null>('/resources/content/assign-editor', {
                      assignedUserId: assignToUserId,
                      contentIds: selectedInProgressContentIds,
                  })
                : Promise.resolve(null);
        const inReviewAssignments =
            selectedReviewContentIds.length > 0
                ? postToApi<null>('/resources/content/assign-review', {
                      assignedUserId: assignToUserId,
                      contentIds: selectedReviewContentIds,
                  })
                : Promise.resolve(null);

        try {
            await Promise.all([inProgessAssignments, inReviewAssignments]);
            isAssigning = false;
            window.location.reload();
        } catch {
            isErrorModalOpen = true;
            isAssigning = false;
        }
    }

    $: manageContentsPromise = data.managerDashboard!.manageResourceContent.promise;
    $: assignedContentsPromise = data.managerDashboard!.assignedResourceContent.promise;

    $: allDataPromise = Promise.all([assignedContentsPromise, manageContentsPromise]);

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);
</script>

{#await allDataPromise}
    <CenteredSpinner />
{:then [assignedContents, manageContents]}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Manager Dashboard</h1>
        <div class="flex flex-row items-center pt-4">
            <div role="tablist" class="tabs tabs-bordered w-fit">
                <button
                    on:click={() => ($searchParams.tab = Tab.myWork)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}"
                    >My Work ({assignedContents.length})</button
                >
                <button
                    on:click={() => ($searchParams.tab = Tab.manage)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.manage && 'tab-active'}"
                    >Manage ({manageContents.length})</button
                >
            </div>
            <div class="grow"></div>
            <button
                data-app-insights-event-name="manager-dashboard-bulk-assign-click"
                class="btn btn-primary btn-sm"
                on:click={() => (isAssignContentModalOpen = true)}
                disabled={selectedReviewContentIds.length === 0 && selectedInProgressContentIds.length === 0}
                >Assign</button
            >
        </div>
        {#if $searchParams.tab === Tab.manage}
            <Select
                class="select select-bordered mt-4 max-w-[14rem] flex-grow"
                bind:value={$searchParams.assignedUserId}
                isNumber={true}
                options={[
                    { value: 0, label: 'Assigned' },
                    ...(data.users || []).map((u) => ({ value: u.id, label: u.name })),
                ]}
            />
        {/if}
        <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-auto">
            <table class="table table-pin-rows">
                {#if $searchParams.tab === Tab.myWork}
                    <thead>
                        <tr class="bg-base-200">
                            <th></th>
                            <th>Title</th>
                            <th>Resource</th>
                            <th>Language</th>
                            <th>Project</th>
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
                        {#each sortAssignedData(assignedContents, $searchParams.sort) as resource (resource.id)}
                            {@const href = `/resources/${resource.id}`}
                            <tr class="hover">
                                <TableCell class="w-4"
                                    ><input
                                        checked={selectedReviewContentIds.includes(resource.id) ||
                                            selectedInProgressContentIds.includes(resource.id)}
                                        on:change={toggleResourceSelection(resource.id, resource.statusValue)}
                                        type="checkbox"
                                        class="checkbox checkbox-sm"
                                    /></TableCell
                                >
                                <LinkedTableCell {href}>{resource.englishLabel}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.parentResourceName}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.languageEnglishDisplay}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.projectName ?? ''}</LinkedTableCell>
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
                            <th></th>
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
                        {#each sortAndFilterManageData(manageContents, $searchParams) as resource (resource.id)}
                            {@const href = `/resources/${resource.id}`}
                            <tr class="hover">
                                <TableCell class="w-4"
                                    ><input
                                        checked={selectedReviewContentIds.includes(resource.id) ||
                                            selectedInProgressContentIds.includes(resource.id)}
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
    header={selectedReviewContentIds.length > 0 ? 'Choose a publisher' : 'Choose a user'}
>
    <UserSelector
        users={data.users?.filter((u) => selectedReviewContentIds.length === 0 || u.role === UserRole.Publisher) ?? []}
        defaultLabel="Select User"
        bind:selectedUserId={assignToUserId}
    />
</Modal>

<Modal header="Error" bind:open={isErrorModalOpen} isError={true} description="Error while assigning content." />

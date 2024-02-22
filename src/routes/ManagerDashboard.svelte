<script lang="ts">
    import type { PageData } from './$types';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp, type SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';
    import type { ResourceAssignedToOwnCompany, ResourceAssignedToSelf } from './+page';
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import { createListSorter } from '$lib/utils/sorting';
    import LinkedTableRow from '$lib/components/LinkedTableRow.svelte';
    import Select from '$lib/components/Select.svelte';

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

    $: manageContentsPromise = unwrapStreamedData(data.managerDashboard!.manageResourceContent);
    $: assignedContentsPromise = unwrapStreamedData(data.managerDashboard!.assignedResourceContent);

    $: allDataPromise = Promise.all([assignedContentsPromise, manageContentsPromise]);

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);
</script>

{#await allDataPromise}
    <CenteredSpinner />
{:then [assignedContents, manageContents]}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Manager Dashboard</h1>
        <div role="tablist" class="tabs tabs-bordered w-fit pt-4">
            <button
                on:click={() => ($searchParams.tab = Tab.myWork)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}"
                >My Work ({assignedContents.length})</button
            >
            <button
                on:click={() => ($searchParams.tab = Tab.manage)}
                role="tab"
                class="tab {$searchParams.tab === Tab.manage && 'tab-active'}">Manage ({manageContents.length})</button
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
        <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-scroll">
            <table class="table table-pin-rows">
                {#if $searchParams.tab === Tab.myWork}
                    <thead>
                        <tr class="bg-base-200">
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
                            <LinkedTableRow
                                href={`/resources/${resource.id}`}
                                cellValues={[
                                    resource.englishLabel,
                                    resource.parentResourceName,
                                    resource.languageEnglishDisplay,
                                    resource.projectName ?? '',
                                    [
                                        resource.daysUntilProjectDeadline ?? '',
                                        (resource.daysUntilProjectDeadline ?? 0) < 0 ? 'text-red' : '',
                                    ],
                                    resource.wordCount ?? '',
                                ]}
                            />
                        {:else}
                            <tr>
                                <td colspan="99" class="text-center">Your work is all done!</td>
                            </tr>
                        {/each}
                    </tbody>
                {:else if $searchParams.tab === Tab.manage}
                    <thead>
                        <tr class="bg-base-200">
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
                            <LinkedTableRow
                                href={`/resources/${resource.id}`}
                                cellValues={[
                                    resource.englishLabel,
                                    resource.parentResourceName,
                                    resource.languageEnglishDisplay,
                                    resource.projectName ?? '',
                                    resource.assignedUser.name,
                                    [
                                        resource.daysUntilProjectDeadline ?? '',
                                        (resource.daysUntilProjectDeadline ?? 0) < 0 ? 'text-error' : '',
                                    ],
                                    resource.wordCount ?? '',
                                ]}
                            />
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

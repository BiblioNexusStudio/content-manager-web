<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import type { Project, ResourceAssignedToSelf } from './+page';
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import { createListSorter } from '$lib/utils/sorting';
    import type { ResourcePendingReview } from './proxy+page';
    import TranslatedResourcesBarChart from '$lib/charts/TranslatedResourcesBarChart.svelte';
    import TotalResourcesAreaChart from '$lib/charts/TotalResourcesAreaChart.svelte';
    import LinkedTableRow from '$lib/components/LinkedTableRow.svelte';

    enum Tab {
        myWork = 'my-work',
        reviewPending = 'review-pending',
        myProjects = 'my-projects',
    }

    const SORT_KEYS = {
        title: 'title',
        language: 'language',
        days: 'days',
        wordCount: 'word-count',
    };

    const sortAssignedResourceData = createListSorter<ResourceAssignedToSelf>({
        [SORT_KEYS.title]: 'englishLabel',
        [SORT_KEYS.language]: 'languageEnglishDisplay',
        [SORT_KEYS.days]: 'daysSinceAssignment',
        [SORT_KEYS.wordCount]: 'wordCount',
    });

    const sortAssignedProjectData = createListSorter<Project>({
        [SORT_KEYS.days]: 'days',
    });

    function sortAndFilterAssignedProjectData(projects: Project[], search: string, sort: string) {
        return sortAssignedProjectData(
            projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
            sort
        );
    }

    const sortPendingData = createListSorter<ResourcePendingReview>({
        [SORT_KEYS.title]: 'englishLabel',
        [SORT_KEYS.language]: 'languageEnglishDisplay',
        [SORT_KEYS.days]: 'daysSinceStatusChange',
        [SORT_KEYS.wordCount]: 'wordCount',
    });

    export let data: PageData;

    let search = '';

    const searchParams = searchParameters({
        sort: ssp.string('-' + SORT_KEYS.days),
        tab: ssp.string(Tab.myWork),
    });

    $: allDataPromise = Promise.all([
        data.publisherDashboard!.assignedResourceContent.promise,
        data.publisherDashboard!.reviewPendingResourceContent.promise,
        data.publisherDashboard!.assignedProjects.promise,
        data.publisherDashboard!.reportingSummary.promise,
    ]);

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);

    function selectTab(tab: Tab) {
        return () => {
            $searchParams.tab = tab;
            $searchParams.sort = tab === Tab.myProjects ? SORT_KEYS.days : '-' + SORT_KEYS.days;
        };
    }
</script>

{#await allDataPromise}
    <CenteredSpinner />
{:then [assignedContents, reviewPendingContents, assignedProjects, reportingSummary]}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Publisher Dashboard</h1>
        <div role="tablist" class="tabs-bordered tabs w-fit pt-4">
            <button
                on:click={selectTab(Tab.myWork)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}"
                >My Work ({assignedContents.length})</button
            >
            <button
                on:click={selectTab(Tab.reviewPending)}
                role="tab"
                class="tab {$searchParams.tab === Tab.reviewPending && 'tab-active'}"
                >Review Pending ({reviewPendingContents.length})</button
            >
            <button
                on:click={selectTab(Tab.myProjects)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myProjects && 'tab-active'}"
                >My Projects ({assignedProjects.length})</button
            >
        </div>
        {#if $searchParams.tab === Tab.myProjects}
            <div class="mt-4 flex flex-row">
                <input class="input input-bordered max-w-xs" bind:value={search} placeholder="Search" />
                <a class="btn btn-primary ms-4" href="/projects/new">Create Project</a>
            </div>
        {/if}
        <div class="flex flex-row space-x-4 overflow-y-hidden">
            <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-auto">
                <table class="table table-pin-rows">
                    {#if $searchParams.tab === Tab.myWork}
                        <thead>
                            <tr class="bg-base-200">
                                <SortingTableHeaderCell
                                    text="Title"
                                    sortKey={SORT_KEYS.title}
                                    bind:currentSort={$searchParams.sort}
                                />
                                <th>Resource</th>
                                <SortingTableHeaderCell
                                    text="Language"
                                    sortKey={SORT_KEYS.language}
                                    bind:currentSort={$searchParams.sort}
                                />
                                <th>Status</th>
                                <SortingTableHeaderCell
                                    text="Days"
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
                            {#each sortAssignedResourceData(assignedContents, $searchParams.sort) as resource (resource.id)}
                                <LinkedTableRow
                                    href={`/resources/${resource.id}`}
                                    cellValues={[
                                        resource.englishLabel,
                                        resource.parentResourceName,
                                        resource.languageEnglishDisplay,
                                        resource.status,
                                        resource.daysSinceAssignment,
                                        resource.wordCount ?? '',
                                    ]}
                                />
                            {:else}
                                <tr>
                                    <td colspan="99" class="text-center">Your work is all done!</td>
                                </tr>
                            {/each}
                        </tbody>
                    {:else if $searchParams.tab === Tab.myProjects}
                        <thead>
                            <tr class="bg-base-200">
                                <th>Title</th>
                                <th>Company</th>
                                <th>Platform</th>
                                <th>Language</th>
                                <SortingTableHeaderCell
                                    text="Days"
                                    sortKey={SORT_KEYS.days}
                                    bind:currentSort={$searchParams.sort}
                                />
                            </tr>
                        </thead>
                        <tbody>
                            {#each sortAndFilterAssignedProjectData(assignedProjects, search, $searchParams.sort) as project (project.id)}
                                <LinkedTableRow
                                    href={`/projects/${project.id}`}
                                    cellValues={[
                                        project.name,
                                        project.company,
                                        project.projectPlatform,
                                        project.language,
                                        [project.days ?? '', (project.days ?? 0) < 0 ? 'text-red-500' : ''],
                                    ]}
                                />
                            {:else}
                                <tr>
                                    <td colspan="99" class="text-center">
                                        {#if !!search}
                                            No results.
                                        {:else}
                                            No projects assigned to you.
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    {:else if $searchParams.tab === Tab.reviewPending}
                        <thead>
                            <tr class="bg-base-200">
                                <SortingTableHeaderCell
                                    text="Title"
                                    sortKey={SORT_KEYS.title}
                                    bind:currentSort={$searchParams.sort}
                                />
                                <th>Resource</th>
                                <SortingTableHeaderCell
                                    text="Language"
                                    sortKey={SORT_KEYS.language}
                                    bind:currentSort={$searchParams.sort}
                                />
                                <SortingTableHeaderCell
                                    text="Days"
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
                            {#each sortPendingData(reviewPendingContents, $searchParams.sort) as resource (resource.id)}
                                <LinkedTableRow
                                    href={`/resources/${resource.id}`}
                                    cellValues={[
                                        resource.englishLabel,
                                        resource.parentResourceName,
                                        resource.languageEnglishDisplay,
                                        resource.daysSinceStatusChange,
                                        resource.wordCount ?? '',
                                    ]}
                                />
                            {:else}
                                <tr>
                                    <td colspan="99" class="text-center">No items pending review.</td>
                                </tr>
                            {/each}
                        </tbody>
                    {/if}
                </table>
            </div>
            <div class="my-4 flex flex-1 flex-col space-y-2 overflow-y-auto">
                <div class="rounded-lg border border-secondary p-2">
                    <TotalResourcesAreaChart
                        selectedLanguages={[]}
                        selectedResource="default"
                        resourcesByLanguage={reportingSummary.resourcesByLanguage}
                        totalsByMonth={reportingSummary.totalsByMonth}
                        resourcesByType={reportingSummary.resourcesByParentResource}
                    />
                </div>
                <div class="rounded-lg border border-secondary p-2">
                    <TranslatedResourcesBarChart
                        selectedLanguages={[]}
                        selectedResource="default"
                        resourcesByLanguage={reportingSummary.resourcesByLanguage}
                        totalsByMonth={reportingSummary.totalsByMonth}
                        languages={reportingSummary.languages}
                    />
                </div>
            </div>
        </div>
    </div>
{/await}

<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import ShowClosed from '$lib/components/projects/ShowClosed.svelte';
    import ProjectSearch from '$lib/components/projects/ProjectSearch.svelte';
    import ProjectTable from '$lib/components/projects/ProjectTable.svelte';
    import { Permission, userCan } from '$lib/stores/auth';
    import { ProjectStatusTab } from '$lib/types/projects';

    export let data: PageData;

    $: projectPromise = data.projectListResponse!.promise;

    let showClosed = false;
    let projectSearchValue = '';
    let currentTab: ProjectStatusTab;
    let activeCount = 0;
    let recentlyFinishedCount = 0;
    const switchTabs = (tab: ProjectStatusTab) => {
        if (currentTab === tab) return;

        currentTab = tab;
    };
</script>

{#await projectPromise}
    <CenteredSpinner />
{:then projectListResponse}
    {#if $userCan(Permission.ReadProjectsInCompany)}
        <div class="m-4 mb-6 flex">
            <h1 class="my-auto text-3xl">Projects</h1>
        </div>
        <div class="m-4 flex flex-col pt-4">
            <div role="tablist" class="tabs tabs-bordered w-fit">
                <button
                    on:click={() => switchTabs(ProjectStatusTab.active)}
                    role="tab"
                    class="tab {currentTab === ProjectStatusTab.active && 'tab-active'}">Active ({activeCount})</button
                >
                <button
                    on:click={() => switchTabs(ProjectStatusTab.recentlyFinished)}
                    role="tab"
                    class="tab {currentTab === ProjectStatusTab.recentlyFinished && 'tab-active'}"
                    >Recently Finished ({recentlyFinishedCount})</button
                >
            </div>
            <div class="flex w-1/5 items-center pt-4">
                <ProjectSearch bind:projectSearchValue />
            </div>
        </div>
    {:else}
        <div class="m-4 mb-6 flex justify-between">
            <h1 class="my-auto text-3xl">Projects</h1>

            <div class="flex w-2/5 items-center">
                <a class="btn btn-primary me-4" href="/projects/new">Create</a>
                <ProjectSearch bind:projectSearchValue />
            </div>
        </div>
        <div class="m-4 mb-6 flex justify-end">
            <ShowClosed bind:showClosed />
        </div>
    {/if}

    <div class="m-4">
        <ProjectTable
            projects={projectListResponse}
            {showClosed}
            {projectSearchValue}
            bind:currentTab
            bind:activeCount
            bind:recentlyFinishedCount
        />
    </div>
{/await}

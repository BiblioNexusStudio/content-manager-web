<script lang="ts">
    import type { PageData } from './$types';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { Permission } from '$lib/stores/auth';
    import { users, project } from '$lib/stores/projects';
    import ArrowLeftSmall from '$lib/icons/ArrowLeftSmall.svelte';
    import ProjectViewTabs from '$lib/components/projects/ProjectViewTabs.svelte';
    import ProjectViewTable from '$lib/components/projects/ProjectViewTable.svelte';
    import ProjectProgressBar from '$lib/components/ProjectProgressBar.svelte';
    import { onMount } from 'svelte';

    export let data: PageData;

    $: projectPromise = unwrapStreamedData(data.projectResponse!);

    function startProject() {
        console.log('start project');
    }

    async function assignApiDataToStore() {
        $project = await projectPromise;
        $users = await unwrapStreamedData(data.users!);
    }

    onMount(() => {
        assignApiDataToStore();
    });
</script>

{#await projectPromise}
    <CenteredSpinner />
{:then projectResponse}
    <div class="m-4 flex justify-between">
        <div class="flex items-center">
            <ArrowLeftSmall />
            <span class="ms-2 text-2xl">
                {projectResponse.company} - {projectResponse.name}
            </span>
        </div>
        <div class="flex">
            {#if projectResponse.started === null && data.currentUser.can(Permission.EditProjects)}
                <button class="btn btn-primary" on:click={startProject}>Start</button>
            {/if}
        </div>
    </div>
    <div class="m-4">
        <ProjectViewTabs />
        <div class="mb-8 w-1/2 pe-8">
            <ProjectProgressBar
                inProgressCount={projectResponse?.counts?.inProgress}
                inReviewCount={projectResponse?.counts?.inReview}
                completeCount={projectResponse?.counts?.completed}
                showLegend={true}
            />
        </div>
    </div>
    <div class="m-4">
        <ProjectViewTable />
    </div>
{/await}

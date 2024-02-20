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
    import { startProject } from '$lib/utils/projects';

    export let data: PageData;
    const { users: dataUsers } = data;

    $: projectPromise = unwrapStreamedData(data.projectResponse!);

    $: disabledStartButton =
        $project?.projectManager &&
        $project?.effectiveWordCount &&
        $project?.quotedCost &&
        $project?.projectedDeliveryDate &&
        $project?.projectedPublishDate;

    function onStartProject() {
        if ($project) {
            startProject($project?.id);
            $project.started = new Date().toISOString();
        }
    }

    async function assignApiDataToStore() {
        $project = await projectPromise;
        $users = dataUsers;
    }

    onMount(() => {
        assignApiDataToStore();
    });
</script>

{#await projectPromise}
    <CenteredSpinner />
{:then projectResponse}
    <div class="flex max-h-screen flex-col overflow-hidden p-4">
        <div class="flex justify-between">
            <div class="flex items-center">
                <ArrowLeftSmall />
                <span class="ms-2 text-2xl">
                    {projectResponse.company} - {projectResponse.name}
                </span>
            </div>
            <div class="flex">
                {#if projectResponse.started === null && data.currentUser.can(Permission.EditProjects)}
                    <button class="btn btn-primary" disabled={!disabledStartButton} on:click={onStartProject}
                        >Start</button
                    >
                {/if}
            </div>
        </div>
        <div>
            <ProjectViewTabs />
            {#if projectResponse?.counts?.inProgress != 0 || projectResponse?.counts?.inReview != 0 || projectResponse?.counts?.completed != 0}
                <div class="mb-8 w-1/2 pe-8">
                    <ProjectProgressBar
                        inProgressCount={projectResponse?.counts?.inProgress}
                        inReviewCount={projectResponse?.counts?.inReview}
                        completeCount={projectResponse?.counts?.completed}
                        showLegend={true}
                    />
                </div>
            {/if}
        </div>
        <div class="flex w-full grow flex-col overflow-hidden rounded-md border">
            <ProjectViewTable />
        </div>
    </div>
{/await}

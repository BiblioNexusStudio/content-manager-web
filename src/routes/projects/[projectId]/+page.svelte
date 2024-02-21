<script lang="ts">
    import type { PageData } from './$types';
    import { unwrapStreamedDataWithCallback } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { Permission } from '$lib/stores/auth';
    import { users, project } from '$lib/stores/projects';
    import ProjectViewTabs from '$lib/components/projects/ProjectViewTabs.svelte';
    import ProjectViewTable from '$lib/components/projects/ProjectViewTable.svelte';
    import ProjectProgressBar from '$lib/components/ProjectProgressBar.svelte';
    import { startProject } from '$lib/utils/projects';
    import { ProjectConstants } from '$lib/types/projects';
    import BackButton from '$lib/components/BackButton.svelte';

    export let data: PageData;
    const { users: dataUsers } = data;

    $: projectPromise = unwrapStreamedDataWithCallback(data.projectResponse!, (projectResponse) => {
        $project = projectResponse;
        $users = dataUsers;
    });

    $: companyLeadSet = $project?.projectPlatform !== ProjectConstants.AQUIFER ? true : $project?.companyLead;

    $: disabledStartButton =
        $project?.projectManager &&
        $project?.effectiveWordCount &&
        $project?.quotedCost &&
        $project?.projectedDeliveryDate &&
        $project?.projectedPublishDate &&
        companyLeadSet;

    function onStartProject() {
        if ($project) {
            startProject($project?.id);
            $project.started = new Date().toISOString();
        }
    }
</script>

{#await projectPromise}
    <CenteredSpinner />
{:then projectResponse}
    <div class="flex max-h-screen flex-col overflow-hidden p-4">
        <div class="flex justify-between">
            <div class="flex items-center">
                <BackButton defaultPathIfNoHistory="/projects" />
                <span class="ms-2 text-2xl">
                    {projectResponse.company} - {projectResponse.name}
                </span>
            </div>
            <div class="flex">
                {#if $project?.started === null && data.currentUser.can(Permission.EditProjects)}
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

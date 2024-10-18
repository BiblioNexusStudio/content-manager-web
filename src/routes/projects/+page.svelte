<script lang="ts">
    import type { PageData } from './$types';
    import ProjectTable from '$lib/components/projects/ProjectTable.svelte';
    import { ProjectStatusTab, type ProjectListResponse } from '$lib/types/projects';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import ProjectTableTabs from '$lib/components/projects/ProjectTableTabs.svelte';
    import ProjectReportingTab from './ProjectReportingTab.svelte';

    export let data: PageData;

    $: projectPromise = data.projectListResponse!.promise;
    $: companiesPromise = data.companies!.promise;
    $: languages = data.languages;
    let currentTab = ProjectStatusTab.active;

    let activeProjects: ProjectListResponse[] = [];
    let recentlyFinishedProjects: ProjectListResponse[] = [];
    let notStartedProjects: ProjectListResponse[] = [];

    $: handleFetchedProjects(projectPromise);

    async function handleFetchedProjects(promise: typeof projectPromise) {
        const projects = await promise;
        activeProjects = projects.filter((p) => p.isStarted && !p.isCompleted);
        recentlyFinishedProjects = projects.filter((p) => p.isCompleted);
        notStartedProjects = projects.filter((p) => !p.isStarted);
    }
</script>

<svelte:head>
    <title>Projects | Aquifer Admin</title>
</svelte:head>

{#await Promise.all([projectPromise, companiesPromise])}
    <CenteredSpinnerFullScreen />
{:then [_, companiesResponse]}
    <div class="flex h-full flex-col overflow-y-auto overflow-x-hidden px-4">
        <div class="mb-6 mt-4 flex">
            <h1 class="my-auto text-3xl">Projects</h1>
        </div>

        <ProjectTableTabs
            activeCount={activeProjects.length}
            recentlyFinishedCount={recentlyFinishedProjects.length}
            notStartedCount={notStartedProjects.length}
            bind:currentTab
        />

        <ProjectReportingTab isShowing={currentTab === ProjectStatusTab.reporting} companies={companiesResponse} />

        <ProjectTable
            isShowing={currentTab !== ProjectStatusTab.reporting}
            {activeProjects}
            {recentlyFinishedProjects}
            {notStartedProjects}
            companies={companiesResponse}
            {currentTab}
            {languages}
        />
    </div>
{:catch error}
    <ErrorMessage uncastError={error} />
{/await}

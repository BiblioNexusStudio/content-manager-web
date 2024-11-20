<script lang="ts">
    import type { PageData } from './$types';
    import ProjectTable from '$lib/components/projects/ProjectTable.svelte';
    import { ProjectStatusTab } from '$lib/types/projects';
    import ProjectTableTabs from '$lib/components/projects/ProjectTableTabs.svelte';
    import ProjectReportingTab from './ProjectReportingTab.svelte';

    export let data: PageData;

    let currentTab = ProjectStatusTab.active;

    $: languages = data.languages;
    $: activeProjects = data.projects.filter((p) => p.isStarted && !p.isCompleted);
    $: recentlyFinishedProjects = data.projects.filter((p) => p.isCompleted);
    $: notStartedProjects = data.projects.filter((p) => !p.isStarted);
</script>

<svelte:head>
    <title>Projects | Aquifer Admin</title>
</svelte:head>

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

    <ProjectReportingTab isShowing={currentTab === ProjectStatusTab.reporting} companies={data.companies} />

    <ProjectTable
        isShowing={currentTab !== ProjectStatusTab.reporting}
        {activeProjects}
        {recentlyFinishedProjects}
        {notStartedProjects}
        companies={data.companies}
        {currentTab}
        {languages}
    />
</div>

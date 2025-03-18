<script lang="ts">
    import type { PageData } from './$types';
    import ProjectTable from '$lib/components/projects/ProjectTable.svelte';
    import { ProjectStatusTab } from '$lib/types/projects';
    import ProjectTableTabs from '$lib/components/projects/ProjectTableTabs.svelte';
    import ProjectReportingTab from './ProjectReportingTab.svelte';
    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let currentTab = $state(ProjectStatusTab.active);

    let languages = $derived(data.languages);
    let activeProjects = $derived(data?.projects?.filter((p) => p.isStarted && !p.isCompleted));
    let recentlyFinishedProjects = $derived(data?.projects?.filter((p) => p.isCompleted));
    let notStartedProjects = $derived(data?.projects?.filter((p) => !p.isStarted));
</script>

<svelte:head>
    <title>Projects | Aquifer Admin</title>
</svelte:head>

<div class="flex h-full flex-col overflow-x-hidden overflow-y-auto px-4">
    <div class="mt-4 mb-6 flex">
        <h1 class="my-auto text-3xl">Projects</h1>
    </div>

    <ProjectTableTabs
        activeCount={activeProjects?.length}
        recentlyFinishedCount={recentlyFinishedProjects?.length}
        notStartedCount={notStartedProjects?.length}
        bind:currentTab
    />

    <ProjectReportingTab isShowing={currentTab === ProjectStatusTab.reporting} companies={data?.companies ?? []} />

    <ProjectTable
        isShowing={currentTab !== ProjectStatusTab.reporting}
        activeProjects={activeProjects ?? []}
        recentlyFinishedProjects={recentlyFinishedProjects ?? []}
        notStartedProjects={notStartedProjects ?? []}
        companies={data?.companies ?? []}
        {currentTab}
        {languages}
    />
</div>

<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import ProjectTable from '$lib/components/projects/ProjectTable.svelte';
    import type { ProjectStatusTab } from '$lib/types/projects';

    export let data: PageData;

    $: projectPromise = data.projectListResponse!.promise;
    $: companiesPromise = data.companies!.promise;

    let currentTab: ProjectStatusTab;
    let activeCount = 0;
    let recentlyFinishedCount = 0;
    let notStartedCount = 0;
</script>

{#await Promise.all([projectPromise, companiesPromise])}
    <CenteredSpinner />
{:then [projectListResponse, companiesResponse]}
    <div class="m-4 mb-6 flex">
        <h1 class="my-auto text-3xl">Projects</h1>
    </div>
    <div class="m-4">
        <ProjectTable
            projects={projectListResponse}
            companies={companiesResponse}
            bind:currentTab
            bind:activeCount
            bind:recentlyFinishedCount
            bind:notStartedCount
            canOnlyViewProjectsInCompany={data.canOnlyViewProjectsInCompany}
        />
    </div>
{/await}

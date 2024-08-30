<script lang="ts">
    import type { PageData } from './$types';
    import ProjectTable from '$lib/components/projects/ProjectTable.svelte';
    import type { ProjectStatusTab } from '$lib/types/projects';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';

    export let data: PageData;

    $: projectPromise = data.projectListResponse!.promise;
    $: companiesPromise = data.companies!.promise;
    $: languages = data.languages;
    let currentTab: ProjectStatusTab;
    let activeCount = 0;
    let recentlyFinishedCount = 0;
    let notStartedCount = 0;
</script>

{#await Promise.all([projectPromise, companiesPromise])}
    <CenteredSpinnerFullScreen />
{:then [projectListResponse, companiesResponse]}
    <div class="flex flex-col overflow-y-hidden">
        <div class="m-4 mb-6 flex">
            <h1 class="my-auto text-3xl">Projects</h1>
        </div>
        <ProjectTable
            projects={projectListResponse}
            companies={companiesResponse}
            bind:currentTab
            bind:activeCount
            bind:recentlyFinishedCount
            bind:notStartedCount
            {languages}
        />
    </div>
{:catch error}
    <ErrorMessage uncastError={error} />
{/await}

<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import ShowClosed from '$lib/components/projects/ShowClosed.svelte';
    import ProjectSearch from '$lib/components/projects/ProjectSearch.svelte';
    import ProjectTable from '$lib/components/projects/ProjectTable.svelte';

    export let data: PageData;

    $: projectPromise = data.projectListResponse!.promise;

    let showClosed = false;
    let projectSearchValue = '';
</script>

{#await projectPromise}
    <CenteredSpinner />
{:then projectListResponse}
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
    <div class="m-4">
        <ProjectTable projects={projectListResponse} {showClosed} {projectSearchValue} />
    </div>
{/await}

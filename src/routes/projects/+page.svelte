<script lang="ts">
    import ShowClosed from '$lib/components/projects/ShowClosed.svelte';
    import ProjectSearch from '$lib/components/projects/ProjectSearch.svelte';
    import ProjectTable from '$lib/components/projects/ProjectTable.svelte';

    let showClosed = false;
    let projectSearchValue = '';
</script>

<div class="m-4 flex justify-between">
    <h1 class="text-3xl">Projects</h1>

    <div class="flex w-2/5 items-center">
        <button class="btn btn-primary me-4">Create</button>
        <ProjectSearch bind:projectSearchValue />
    </div>
</div>
<div class="m-4 flex justify-end">
    <ShowClosed bind:showClosed />
</div>
<div class="m-4">
    <ProjectTable />
</div>

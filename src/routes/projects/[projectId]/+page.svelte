<script lang="ts">
    import ArrowLeftSmall from '$lib/icons/ArrowLeftSmall.svelte';
    import ProjectViewTabs from '$lib/components/projects/ProjectViewTabs.svelte';
    import ProjectViewTable from '$lib/components/projects/ProjectViewTable.svelte';

    const company = 'Christian Lingua';
    const title = 'TSN Luke Swahili';
</script>

<div class="m-4 flex justify-between">
    <div class="flex items-center">
        <ArrowLeftSmall />
        <span class="ms-2 text-2xl">
            {company} - {title}
        </span>
    </div>
    <div class="flex">
        <button class="btn btn-primary me-4">Start</button>
        <button class="btn btn-primary">Download</button>
    </div>
</div>
<div class="m-4">
    <ProjectViewTabs />
</div>
<div class="m-4">
    <ProjectViewTable />
</div>

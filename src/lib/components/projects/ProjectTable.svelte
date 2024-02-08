<script lang="ts">
    import type { ProjectListResponse } from '$lib/types/projects';
    import ProjectProgressBar from '../ProjectProgressBar.svelte';

    export let projects: ProjectListResponse[] = [];
    export let showClosed = false;
    export let projectSearchValue = '';

    $: listData = filterListData(projects, showClosed, projectSearchValue);

    function filterListData(projects: ProjectListResponse[], showClosed: boolean, projectSearchValue: string) {
        return projects.filter((project) => {
            const isClosed = project.counts.inProgress === 0 && project.counts.inReview === 0;
            const matchesSearchValue = [project.name].some((field) =>
                field.toLocaleLowerCase().includes(projectSearchValue.toLowerCase())
            );

            if (!showClosed && !projectSearchValue) {
                return true;
            } else if (showClosed && !projectSearchValue) {
                return isClosed;
            } else if (!showClosed && projectSearchValue) {
                return matchesSearchValue;
            } else {
                return isClosed && matchesSearchValue;
            }
        });
    }

    const columns = [
        { name: 'title', label: 'Title' },
        { name: 'company', label: 'Company' },
        { name: 'platform', label: 'Platform' },
        { name: 'language', label: 'Language' },
        { name: 'projectLead', label: 'Project Lead' },
        { name: 'days', label: 'Days' },
        { name: 'progress', label: 'Progress' },
    ];
</script>

<div class="grid w-full grid-cols-7 rounded-md border border-b-0">
    {#each columns as column}
        <div class="border-b bg-gray-50 px-4 py-3 text-xs font-bold">{column.label}</div>
    {/each}
    {#each listData as row}
        <div class="border-b px-4 py-3 text-xs">{row.name}</div>
        <div class="border-b px-4 py-3 text-xs">{row.company}</div>
        <div class="border-b px-4 py-3 text-xs">{row.projectPlatform}</div>
        <div class="border-b px-4 py-3 text-xs">{row.language}</div>
        <div class="border-b px-4 py-3 text-xs">{row.projectLead}</div>
        <div class="border-b px-4 py-3 text-xs">{row.days === null ? '' : row.days}</div>
        <div class="border-b px-4 py-3 text-xs">
            <ProjectProgressBar
                inProgressCount={row.counts.inProgress}
                inReviewCount={row.counts.inReview}
                completeCount={row.counts.completed}
                showLegend={false}
            />
        </div>
    {/each}
</div>

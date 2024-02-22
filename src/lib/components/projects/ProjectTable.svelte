<script lang="ts">
    import type { ProjectListResponse, ProjectTableColumn } from '$lib/types/projects';
    import ProjectProgressBar from '../ProjectProgressBar.svelte';
    import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte';
    import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte';

    export let projects: ProjectListResponse[] = [];
    export let showClosed = false;
    export let projectSearchValue = '';

    let currentColumn = 'days';
    let sortedRemoved = true;

    const initColumnsState: ProjectTableColumn[] = [
        { name: 'name', label: 'Title', sorted: false },
        { name: 'company', label: 'Company', sorted: false },
        { name: 'projectPlatform', label: 'Platform', sorted: false },
        { name: 'language', label: 'Language', sorted: false },
        { name: 'projectLead', label: 'Project Lead', sorted: false },
        { name: 'days', label: 'Days', sorted: true },
        { name: 'progress', label: 'Progress', sorted: false },
    ];

    $: listData = handleListData(projects, showClosed, projectSearchValue, columns);
    $: columns = sortListData(currentColumn);

    function handleListData(
        projects: ProjectListResponse[],
        showClosed: boolean,
        projectSearchValue: string,
        columns: ProjectTableColumn[]
    ) {
        const lowerCaseSearchValue = projectSearchValue.toLowerCase();

        const unsortedProjects = projects.filter((project) => {
            const isClosed = project.counts.inProgress === 0 && project.counts.inReview === 0 && project.isStarted;
            const matchesSearchValue = [project.name].some((field) =>
                field.toLowerCase().includes(lowerCaseSearchValue)
            );

            if (!showClosed && !projectSearchValue) {
                return !isClosed;
            } else if (showClosed && !projectSearchValue) {
                return true;
            } else if (!showClosed && projectSearchValue) {
                return !isClosed && matchesSearchValue;
            } else {
                return matchesSearchValue;
            }
        });

        const sortedProjects = unsortedProjects.sort((a, b) => {
            const sortedColumn = columns.find((column) => column.sorted);

            if (sortedColumn && sortedColumn.name !== 'days' && sortedColumn.name !== 'progress') {
                const fieldA = a[sortedColumn.name as keyof ProjectListResponse];
                const fieldB = b[sortedColumn.name as keyof ProjectListResponse];

                if (fieldA && fieldB && fieldA < fieldB) {
                    return -1;
                }
                if (fieldA && fieldB && fieldA > fieldB) {
                    return 1;
                }
                return 0;
            }

            if (sortedColumn && sortedColumn.name === 'days') {
                const daysA = a.days !== null ? a.days : Infinity;
                const daysB = b.days !== null ? b.days : Infinity;
                return daysA! - daysB!;
            }

            return a.name.localeCompare(b.name);
        });

        return sortedProjects;
    }

    function sortListData(columnName: string) {
        initColumnsState.forEach((col) => (col.sorted = false));

        const column = initColumnsState.find((col) => col.name === columnName);

        if (column) {
            column.sorted = true;
            currentColumn = columnName;
        }

        return initColumnsState;
    }
</script>

<div class="grid w-full grid-cols-7 rounded-md border border-b-0">
    {#each columns as column (column.name)}
        <div class="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
            <div class="text-xs font-bold">{column.label}</div>
            <div>
                {#if column.sorted && column.name !== 'progress' && !sortedRemoved}
                    <button class="flex w-8 items-center justify-end" on:click={() => sortListData(column.name)}>
                        <ChevronUpIcon />
                    </button>
                {:else if !column.sorted && column.name !== 'progress' && !sortedRemoved}
                    <button class="flex w-8 items-center justify-end" on:click={() => sortListData(column.name)}>
                        <ChevronDownIcon />
                    </button>
                {/if}
            </div>
        </div>
    {/each}
    {#each listData as row (row.id)}
        {@const redColor = row?.days && row?.days < 0}
        <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs">{row.name}</a>
        <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs">{row.company}</a>
        <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs">{row.projectPlatform}</a>
        <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs">{row.language}</a>
        <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs">{row.projectLead}</a>
        <div class="flex items-center border-b px-4 py-3 text-xs {redColor ? 'font-bold text-red-600' : ''}">
            {(row.counts.inProgress === 0 && row.counts.inReview === 0 && row.isStarted) || row.days === null
                ? ''
                : row.days}
        </div>
        <div class="flex items-center border-b px-4 py-3 text-xs">
            <ProjectProgressBar
                inProgressCount={row.counts.inProgress}
                inReviewCount={row.counts.inReview}
                completeCount={row.counts.completed}
                showLegend={false}
            />
        </div>
    {/each}
</div>

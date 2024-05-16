<script lang="ts">
    import type { ProjectListResponse, ProjectTableColumn } from '$lib/types/projects';
    import ProjectProgressBar from '../ProjectProgressBar.svelte';
    import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte';
    import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte';

    export let projects: ProjectListResponse[] = [];
    export let showClosed = false;
    export let projectSearchValue = '';

    let currentColumn = 'days';
    let sortAsc = true;

    const initColumnsState: ProjectTableColumn[] = [
        { name: 'name', label: 'Title', sorted: false, sortable: true },
        { name: 'company', label: 'Company', sorted: false, sortable: true },
        { name: 'projectPlatform', label: 'Platform', sorted: false, sortable: true },
        { name: 'language', label: 'Language', sorted: false, sortable: true },
        { name: 'projectLead', label: 'Project Lead', sorted: false, sortable: true },
        { name: 'days', label: 'Days', sorted: true, sortable: true },
        { name: 'progress', label: 'Progress', sorted: false, sortable: false },
    ];

    $: columns = handleColumnState(currentColumn);
    $: listData = handleListData(projects, showClosed, projectSearchValue, columns, sortAsc);

    function handleListData(
        projects: ProjectListResponse[],
        showClosed: boolean,
        projectSearchValue: string,
        columns: ProjectTableColumn[],
        sortAsc: boolean
    ) {
        const lowerCaseSearchValue = projectSearchValue.toLowerCase();

        const unsortedProjects = projects.filter((project) => {
            const isClosed =
                project.counts.notStarted === 0 &&
                project.counts.inProgress === 0 &&
                project.counts.inManagerReview === 0 &&
                project.counts.inPublisherReview === 0 &&
                project.isStarted;
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
                    return sortAsc ? -1 : 1;
                }
                if (fieldA && fieldB && fieldA > fieldB) {
                    return sortAsc ? 1 : -1;
                }
                return 0;
            }

            if (sortedColumn && sortedColumn.name === 'days') {
                const daysA = a.days === null || isProjectClosed(a) ? Infinity : a.days;
                const daysB = b.days === null || isProjectClosed(b) ? Infinity : b.days;
                if (sortAsc) {
                    return daysA! - daysB!;
                } else {
                    return daysB! - daysA!;
                }
            }

            return a.name.localeCompare(b.name);
        });

        return sortedProjects;
    }

    function handleColumnState(columnName: string) {
        initColumnsState.forEach((col) => (col.sorted = false));

        const column = initColumnsState.find((col) => col.name === columnName);

        if (column) {
            column.sorted = true;
            currentColumn = columnName;
        }

        return initColumnsState;
    }

    function setCurrentColumn(columnName: string) {
        if (columnName === currentColumn) {
            sortAsc = !sortAsc;
        } else {
            sortAsc = true;
        }

        currentColumn = columnName;
    }

    function isProjectClosed(project: ProjectListResponse) {
        return (
            project.counts.notStarted +
                project.counts.inProgress +
                project.counts.inManagerReview +
                project.counts.inPublisherReview ===
                0 && project.isStarted
        );
    }
</script>

<div class="grid w-full grid-cols-7 rounded-md border border-b-0">
    {#each columns as column (column.name)}
        <div
            class="flex items-center justify-between border-b {column.sorted ? 'bg-gray-200' : 'bg-gray-50'} px-4 py-3"
        >
            <div class="text-xs font-bold">{column.label}</div>
            <div>
                {#if column.sorted && column.sortable && sortAsc}
                    <button
                        data-app-insights-event-name="projects-{column.name}-sort-click"
                        class="flex w-12 items-center justify-end"
                        on:click={() => setCurrentColumn(column.name)}
                    >
                        <ChevronUpIcon />
                    </button>
                {:else if column.sorted && column.sortable && !sortAsc}
                    <button
                        data-app-insights-event-name="projects-{column.name}-sort-click"
                        class="flex w-12 items-center justify-end"
                        on:click={() => setCurrentColumn(column.name)}
                    >
                        <ChevronDownIcon />
                    </button>
                {:else if !column.sorted && column.sortable}
                    <button
                        data-app-insights-event-name="projects-{column.name}-sort-click"
                        class="flex w-12 items-center justify-end"
                        on:click={() => setCurrentColumn(column.name)}
                    >
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
            {isProjectClosed(row) || row.days === null ? '' : row.days}
        </div>
        <div class="flex items-center border-b px-4 py-3 text-xs">
            {#if row.isStarted}
                <ProjectProgressBar
                    notStartedCount={row.counts.notStarted}
                    inProgressCount={row.counts.inProgress}
                    inManagerReviewCount={row.counts.inManagerReview}
                    inPublisherReviewCount={row.counts.inPublisherReview}
                    completeCount={row.counts.completed}
                    showLegend={false}
                />
            {/if}
        </div>
    {/each}
</div>

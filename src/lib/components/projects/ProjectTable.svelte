<script lang="ts">
    import { ProjectStatusTab, type ProjectListResponse, type ProjectTableColumn } from '$lib/types/projects';
    import ProjectProgressBar from '../ProjectProgressBar.svelte';
    import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte';
    import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte';
    import ProjectTableTabs from './ProjectTableTabs.svelte';
    import ProjectSearch from './ProjectSearch.svelte';
    import type { Company } from '$lib/types/base';
    import Select from '$lib/components/Select.svelte';
    import { Permission, userCan } from '$lib/stores/auth';

    export let projects: ProjectListResponse[] = [];

    export let canOnlyViewProjectsInCompany: boolean;
    export let companies: Company[];
    export let currentTab: ProjectStatusTab = canOnlyViewProjectsInCompany
        ? ProjectStatusTab.active
        : ProjectStatusTab.none;
    export let activeCount = 0;
    export let recentlyFinishedCount = 0;
    export let notStartedCount = 0;

    let filterByCompany: string | null = null;
    let projectSearchValue = '';
    let currentColumn = 'days';
    let sortAsc = true;

    const initColumnsState: ProjectTableColumn[] = !canOnlyViewProjectsInCompany
        ? [
              { name: 'name', label: 'Title', sorted: false, sortable: true },
              { name: 'company', label: 'Company', sorted: false, sortable: true },
              { name: 'projectPlatform', label: 'Platform', sorted: false, sortable: true },
              { name: 'language', label: 'Language', sorted: false, sortable: true },
              { name: 'projectLead', label: 'Project Lead', sorted: false, sortable: true },
              { name: 'days', label: 'Days', sorted: true, sortable: true },
              { name: 'progress', label: 'Progress', sorted: false, sortable: false },
          ]
        : [
              { name: 'name', label: 'Title', sorted: false, sortable: true },
              { name: 'company', label: 'Company', sorted: false, sortable: false },
              { name: 'projectPlatform', label: 'Platform', sorted: false, sortable: false },
              { name: 'resource', label: 'Resource', sorted: false, sortable: false },
              { name: 'language', label: 'Language', sorted: false, sortable: false },
              { name: 'manager', label: 'Manager', sorted: false, sortable: false },
              { name: 'itemCount', label: 'Items', sorted: false, sortable: true },
              { name: 'wordCount', label: 'Words', sorted: false, sortable: true },
              { name: 'days', label: 'Days', sorted: true, sortable: true },
              { name: 'progress', label: 'Progress', sorted: false, sortable: false },
          ];

    $: columns = handleColumnState(currentColumn);
    $: listData = handleListData(projects, projectSearchValue, columns, sortAsc, currentTab, filterByCompany);

    function handleListData(
        projects: ProjectListResponse[],
        projectSearchValue: string,
        columns: ProjectTableColumn[],
        sortAsc: boolean,
        currentTab: ProjectStatusTab,
        filterByCompany: string | null
    ) {
        const lowerCaseSearchValue = projectSearchValue.toLowerCase();

        const unsortedProjects = projects.filter((project) => {
            const matchesSearchValue = [project.name].some((field) =>
                field.toLowerCase().includes(lowerCaseSearchValue)
            );
            const matchesCompany = filterByCompany == null || filterByCompany == project.company;

            if (matchesCompany && lowerCaseSearchValue.length === 0) {
                return true;
            } else if (matchesCompany && lowerCaseSearchValue.length > 0 && matchesSearchValue) {
                return true;
            }
            return false;
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

        let activeProjects = sortedProjects.filter((p) => p.isStarted && p.counts.completed !== p.itemCount);
        let recentlyFinishedProjects = sortedProjects.filter((p) => p.isStarted && p.counts.completed === p.itemCount);
        let notStartedProjects = sortedProjects.filter((p) => !p.isStarted);

        notStartedCount = notStartedProjects.length;
        activeCount = activeProjects.length;
        recentlyFinishedCount = recentlyFinishedProjects.length;

        switch (currentTab) {
            case ProjectStatusTab.active:
                return activeProjects;
            case ProjectStatusTab.recentlyFinished:
                return recentlyFinishedProjects;
            case ProjectStatusTab.notStarted:
                return notStartedProjects;
        }

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

<div>
    <ProjectTableTabs
        {canOnlyViewProjectsInCompany}
        bind:activeCount
        bind:recentlyFinishedCount
        bind:notStartedCount
        bind:currentTab
    />
    <div class="flex flex-row pt-4">
        <div class="flex w-2/5 items-center py-4">
            {#if $userCan(Permission.CreateProject)}
                <a class="btn btn-primary me-4" href="/projects/new">Create</a>
            {/if}
            <div class="relative mr-4 h-full grow"><ProjectSearch bind:projectSearchValue /></div>
            {#if $userCan(Permission.ReadProjects)}
                <Select
                    class="select select-bordered max-w-xs"
                    options={[
                        { value: null, label: 'Select Company' },
                        ...companies.map((c) => ({ value: c.name, label: c.name })),
                    ]}
                    isNumber={false}
                    bind:value={filterByCompany}
                />
            {/if}
        </div>
    </div>

    <div
        class="grid w-full {!canOnlyViewProjectsInCompany
            ? 'grid-cols-7'
            : 'grid-cols-10'}  rounded-md border border-b-0"
    >
        {#each columns as column (column.name)}
            <div
                class="flex items-center justify-between border-b {column.sorted
                    ? 'bg-gray-200'
                    : 'bg-gray-50'} px-4 py-3"
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
            <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs"
                >{row.projectPlatform}</a
            >
            {#if canOnlyViewProjectsInCompany}
                <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs">{row.resource}</a>
            {/if}
            <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs">{row.language}</a>
            {#if canOnlyViewProjectsInCompany}
                <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs"
                    >{row.manager ?? ''}</a
                >
                <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs"
                    >{row.itemCount ?? ''}</a
                >
                <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs"
                    >{row.wordCount ?? ''}</a
                >
            {:else}
                <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs"
                    >{row.projectLead}</a
                >
            {/if}

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
</div>

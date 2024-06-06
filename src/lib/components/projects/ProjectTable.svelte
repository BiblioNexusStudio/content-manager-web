<script lang="ts">
    import { ProjectStatusTab, type ProjectListResponse, type ProjectTableColumn } from '$lib/types/projects';
    import ProjectProgressBar from '../ProjectProgressBar.svelte';
    import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte';
    import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte';
    import ProjectTableTabs from './ProjectTableTabs.svelte';
    import ProjectSearch from './ProjectSearch.svelte';
    import type { Company, Language } from '$lib/types/base';
    import Select from '$lib/components/Select.svelte';
    import { Permission, userCan } from '$lib/stores/auth';
    import { formatNumberWithCommas } from '$lib/utils/projects';

    export let projects: ProjectListResponse[] = [];
    export let languages: Language[] = [];

    export let companies: Company[];
    export let currentTab: ProjectStatusTab = $userCan(Permission.ReadProjects)
        ? ProjectStatusTab.none
        : ProjectStatusTab.active;
    export let activeCount = 0;
    export let recentlyFinishedCount = 0;
    export let notStartedCount = 0;

    let filterByCompany: string | null = null;
    let filterByLanguage: string | null = null;
    let projectSearchValue = '';
    let currentColumn = 'days';
    let sortAsc = true;

    const initColumnsState: ProjectTableColumn[] = $userCan(Permission.ReadProjects)
        ? [
              { name: 'name', label: 'Title', sorted: false, sortable: true },
              { name: 'company', label: 'Company', sorted: false, sortable: false },
              { name: 'projectPlatform', label: 'Platform', sorted: false, sortable: false },
              { name: 'resource', label: 'Resource', sorted: false, sortable: false },
              { name: 'language', label: 'Language', sorted: false, sortable: false },
              { name: 'projectLead', label: 'Project Lead', sorted: false, sortable: true },
              { name: 'itemCount', label: 'Items', sorted: false, sortable: true },
              { name: 'wordCount', label: 'Word Count', sorted: false, sortable: true },
              { name: 'days', label: 'Days', sorted: true, sortable: true },
              { name: 'progress', label: 'Progress', sorted: false, sortable: false },
          ]
        : [
              { name: 'name', label: 'Title', sorted: false, sortable: true },
              { name: 'company', label: 'Company', sorted: false, sortable: true },
              { name: 'projectPlatform', label: 'Platform', sorted: false, sortable: true },
              { name: 'resource', label: 'Resource', sorted: false, sortable: false },
              { name: 'language', label: 'Language', sorted: false, sortable: true },
              { name: 'manager', label: 'Manager', sorted: false, sortable: false },
              { name: 'itemCount', label: 'Items', sorted: false, sortable: true },
              { name: 'wordCount', label: 'Word Count', sorted: false, sortable: true },
              { name: 'days', label: 'Days', sorted: true, sortable: true },
              { name: 'progress', label: 'Progress', sorted: false, sortable: false },
          ];

    $: columns = handleColumnState(currentColumn);
    $: listData = handleListData(
        projects,
        projectSearchValue,
        columns,
        sortAsc,
        currentTab,
        filterByCompany,
        filterByLanguage
    );

    function handleListData(
        projects: ProjectListResponse[],
        projectSearchValue: string,
        columns: ProjectTableColumn[],
        sortAsc: boolean,
        currentTab: ProjectStatusTab,
        filterByCompany: string | null,
        filterByLanguage: string | null
    ) {
        const lowerCaseSearchValue = projectSearchValue.toLowerCase();

        const unsortedProjects = projects.filter((project) => {
            const matchesSearchValue = [project.name].some((field) =>
                field.toLowerCase().includes(lowerCaseSearchValue)
            );
            const matchesCompany = filterByCompany == null || filterByCompany == project.company;
            const matchesLanguage = filterByLanguage == null || filterByLanguage == project.language;

            if (matchesCompany && matchesLanguage && lowerCaseSearchValue.length === 0) {
                return true;
            } else if (matchesCompany && matchesLanguage && lowerCaseSearchValue.length > 0 && matchesSearchValue) {
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
    <ProjectTableTabs bind:activeCount bind:recentlyFinishedCount bind:notStartedCount bind:currentTab />
    <div class="flex flex-row">
        <div class="flex items-center py-4 {$userCan(Permission.ReadProjects) ? 'w-4/5' : 'w-1/5'}">
            {#if $userCan(Permission.CreateProject)}
                <a class="btn btn-primary me-4" href="/projects/new">Create</a>
            {/if}
            <div class="relative me-4 h-full grow"><ProjectSearch bind:projectSearchValue /></div>
            {#if $userCan(Permission.ReadProjects)}
                <Select
                    class="select select-bordered me-4 max-w-xs"
                    options={[
                        { value: null, label: 'Select Company' },
                        ...companies.map((c) => ({ value: c.name, label: c.name })),
                    ]}
                    isNumber={false}
                    bind:value={filterByCompany}
                />
                <Select
                    class="select select-bordered me-4 max-w-xs"
                    options={[
                        { value: null, label: 'Select Language' },
                        ...languages.map((l) => ({ value: l.englishDisplay, label: l.englishDisplay })),
                    ]}
                    isNumber={false}
                    bind:value={filterByLanguage}
                />
            {/if}
        </div>
    </div>

    <div class="grid w-full grid-cols-10 rounded-md border border-b-0">
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
            <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs">{row.resource}</a>
            <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs">{row.language}</a>
            {#if $userCan(Permission.ReadProjects)}
                <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs"
                    >{row.projectLead}</a
                >
            {:else}
                <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs"
                    >{row.manager ?? ''}</a
                >
            {/if}
            <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs"
                >{formatNumberWithCommas(row.itemCount) ?? ''}</a
            >
            <a href={`/projects/${row.id}`} class="flex items-center border-b px-4 py-3 text-xs"
                >{formatNumberWithCommas(row.wordCount) ?? ''}</a
            >

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

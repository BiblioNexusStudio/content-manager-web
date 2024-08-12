<script lang="ts">
    import { ProjectStatusTab, type ProjectListResponse } from '$lib/types/projects';
    import ProjectProgressBar from '../ProjectProgressBar.svelte';
    import ProjectTableTabs from './ProjectTableTabs.svelte';
    import ProjectSearch from './ProjectSearch.svelte';
    import type { Company, Language } from '$lib/types/base';
    import Select from '$lib/components/Select.svelte';
    import { Permission, userCan } from '$lib/stores/auth';
    import Table from '$lib/components/Table.svelte';
    import { projectTableColumns, projectTableColumnsWithManager } from './project-table-columns';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import { createProjectListSorter, SortName } from './project-table-sorter';

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

    const sortProjectListData = createProjectListSorter<ProjectListResponse>();

    const searchParams = searchParameters({ sort: ssp.string(SortName.Days) }, { runLoadAgainWhenParamsChange: false });

    $: listData = handleListData(projects, projectSearchValue, currentTab, filterByCompany, filterByLanguage);

    function handleListData(
        projects: ProjectListResponse[],
        projectSearchValue: string,
        currentTab: ProjectStatusTab,
        filterByCompany: string | null,
        filterByLanguage: string | null
    ) {
        const lowerCaseSearchValue = projectSearchValue.toLowerCase();

        const listData = projects
            .filter((project) => {
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
            })
            .map((project) => ({
                ...project,
                daysForSorting: project.days === null || isProjectClosed(project) ? Infinity : project.days,
            }));

        let activeProjects = listData.filter((p) => p.isStarted && p.counts.completed !== p.itemCount);
        let recentlyFinishedProjects = listData.filter((p) => p.isStarted && p.counts.completed === p.itemCount);
        let notStartedProjects = listData.filter((p) => !p.isStarted);

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

        return listData;
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

<div class="mx-4 flex flex-col">
    <ProjectTableTabs bind:activeCount bind:recentlyFinishedCount bind:notStartedCount bind:currentTab />

    <div class="flex w-full items-center py-4">
        {#if $userCan(Permission.CreateProject)}
            <a class="btn btn-primary me-4" href="/projects/new">Create</a>
        {/if}
        <div class="relative me-4 h-full w-80"><ProjectSearch bind:projectSearchValue /></div>
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
<div class="mx-4 max-h-full flex-[2] overflow-y-scroll">
    <Table
        columns={$userCan(Permission.ReadProjects) ? projectTableColumns : projectTableColumnsWithManager}
        items={sortProjectListData(listData, $searchParams.sort)}
        idColumn="id"
        enableSelectAll={false}
        enableSelect={false}
        searchText={projectSearchValue}
        searchable={true}
        bind:searchParams={$searchParams}
        itemUrlPrefix="/projects/"
        let:item
        let:href
        let:itemKey
        let:columnText
    >
        {#if columnText === 'Progress'}
            <td>
                <ProjectProgressBar
                    notStartedCount={item.counts.notStarted}
                    inProgressCount={item.counts.inProgress}
                    inManagerReviewCount={item.counts.inManagerReview}
                    inPublisherReviewCount={item.counts.inPublisherReview}
                    completeCount={item.counts.completed}
                    showLegend={false}
                />
            </td>
        {:else if href !== undefined && itemKey}
            <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
        {:else if itemKey}
            <TableCell>{item[itemKey] ?? ''}</TableCell>
        {/if}
    </Table>
</div>

<script lang="ts">
    import { ProjectStatusTab, type ProjectListResponse } from '$lib/types/projects';
    import ProjectProgressBar from '../ProjectProgressBar.svelte';
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
    interface Props {
        isShowing: boolean;
        languages: Language[];
        companies: Company[];
        currentTab: ProjectStatusTab;
        activeProjects: ProjectListResponse[];
        recentlyFinishedProjects: ProjectListResponse[];
        notStartedProjects: ProjectListResponse[];
    }

    let {
        isShowing,
        languages,
        companies,
        currentTab,
        activeProjects,
        recentlyFinishedProjects,
        notStartedProjects,
    }: Props = $props();

    let filterByCompany: string | null = $state(null);
    let filterByLanguage: string | null = $state(null);
    let projectSearchValue = $state('');

    const sortProjectListData = createProjectListSorter<ProjectListResponse>();

    const searchParams = searchParameters({ sort: ssp.string(SortName.Days) }, { runLoadAgainWhenParamsChange: false });

    let listData = $derived(
        handleListData(
            activeProjects,
            recentlyFinishedProjects,
            notStartedProjects,
            projectSearchValue,
            currentTab,
            filterByCompany,
            filterByLanguage
        )
    );

    function handleListData(
        activeProjects: ProjectListResponse[],
        recentlyFinishedProjects: ProjectListResponse[],
        notStartedProjects: ProjectListResponse[],
        projectSearchValue: string,
        currentTab: ProjectStatusTab,
        filterByCompany: string | null,
        filterByLanguage: string | null
    ) {
        const lowerCaseSearchValue = projectSearchValue.toLowerCase();

        let listDataOutput: ProjectListResponse[] | undefined;

        switch (currentTab) {
            case ProjectStatusTab.active:
                listDataOutput = activeProjects;
                break;
            case ProjectStatusTab.recentlyFinished:
                listDataOutput = recentlyFinishedProjects;
                break;
            case ProjectStatusTab.notStarted:
                listDataOutput = notStartedProjects;
                break;
        }

        listDataOutput = (listDataOutput ?? [])
            .filter((project) => {
                const matchesSearchValue = [project.name].some((field) =>
                    field.toLowerCase().includes(lowerCaseSearchValue)
                );
                const matchesCompany = filterByCompany === null || filterByCompany === project.company;
                const matchesLanguage = filterByLanguage === null || filterByLanguage === project.language;

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

        return listDataOutput;
    }

    function isProjectClosed(project: ProjectListResponse) {
        return (
            project.counts.notStarted +
                project.counts.editorReview +
                project.counts.inCompanyReview +
                project.counts.inPublisherReview ===
                0 && project.isStarted
        );
    }
</script>

<div class="flex flex-col overflow-y-hidden pb-4 {isShowing || 'hidden'}">
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
        noItemsText="No results."
    >
        {#snippet tableCells(item, href, itemKey, columnText)}
            {#if columnText === 'Progress'}
                <td>
                    <ProjectProgressBar
                        notStartedCount={item.counts.notStarted}
                        editorReviewCount={item.counts.editorReview}
                        inCompanyReviewCount={item.counts.inCompanyReview}
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
        {/snippet}
    </Table>
</div>

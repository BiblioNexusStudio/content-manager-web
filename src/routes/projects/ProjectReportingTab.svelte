<script lang="ts">
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import ProjectProgressBar from '$lib/components/ProjectProgressBar.svelte';
    import Select from '$lib/components/Select.svelte';
    import Table from '$lib/components/Table.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import BarChart from '$lib/components/reporting/BarChart.svelte';
    import LineChart from '$lib/components/reporting/LineChart.svelte';
    import ReportingLink from '$lib/components/reporting/ReportingLink.svelte';
    import { companiesToIgnore, type Company } from '$lib/types/base';
    import type {
        ActiveProjectsPerCompanyResponse,
        CompanyAverageDaysInWorkflowResponse,
        CompanyCompletedItemsPerMonthResponse,
    } from '$lib/types/projects';
    import type { DynamicReport } from '$lib/types/reporting';
    import type { column } from '$lib/types/table';
    import { getFromApi } from '$lib/utils/http-service';
    import { convertDynamicReportToResponseObjects, reportingUiLinks, reportApiPaths } from '$lib/utils/reporting';

    export let companies: Company[];
    export let isShowing: boolean;

    type ResourceSize = 'both' | 'short' | 'long';

    let activeProjectsPerCompany: ActiveProjectsPerCompanyResponse[] | null = null;
    let companyCompletedItemsPerMonth: CompanyCompletedItemsPerMonthResponse[] | null = null;
    let companyAverageDaysInWorkflow: CompanyAverageDaysInWorkflowResponse[] | null = null;

    let companyPerformanceMetricsCompanyId: number | null = null;
    let companyPerformanceMetricsResourceSize: ResourceSize = 'both';

    $: companies[0] &&
        companyPerformanceMetricsCompanyId === null &&
        (companyPerformanceMetricsCompanyId = companies[0].id);

    $: fetchActiveProjectsTableReport(isShowing);
    $: fetchCompanyCompletedItemsPerMonth(isShowing, companyPerformanceMetricsCompanyId);
    $: fetchCompanyAverageDaysInWorkflow(isShowing, companyPerformanceMetricsCompanyId);

    async function fetchActiveProjectsTableReport(isShowing: boolean) {
        if (isShowing && activeProjectsPerCompany === null) {
            activeProjectsPerCompany = convertDynamicReportToResponseObjects<ActiveProjectsPerCompanyResponse>(
                await getFromApi<DynamicReport>(reportApiPaths.activeProjectsByCompany)
            ).filter((p) => !companiesToIgnore.includes(p.company));
        }
    }

    async function fetchCompanyCompletedItemsPerMonth(
        isShowing: boolean,
        companyPerformanceMetricsCompanyId: number | null
    ) {
        if (isShowing && companyPerformanceMetricsCompanyId !== null && companyCompletedItemsPerMonth === null) {
            companyCompletedItemsPerMonth =
                convertDynamicReportToResponseObjects<CompanyCompletedItemsPerMonthResponse>(
                    await getFromApi<DynamicReport>(
                        `${reportApiPaths.monthlyCompletedItemsForCompany}?companyId=${companyPerformanceMetricsCompanyId}`
                    )
                );
        }
    }

    async function fetchCompanyAverageDaysInWorkflow(
        isShowing: boolean,
        companyPerformanceMetricsCompanyId: number | null
    ) {
        if (isShowing && companyPerformanceMetricsCompanyId !== null && companyAverageDaysInWorkflow === null) {
            companyAverageDaysInWorkflow = convertDynamicReportToResponseObjects<CompanyAverageDaysInWorkflowResponse>(
                await getFromApi<DynamicReport>(
                    `${reportApiPaths.monthlyAverageDaysInWorkflowForCompany}?companyId=${companyPerformanceMetricsCompanyId}`
                )
            );
        }
    }

    function clearFetchedCompanyPerformanceMetricsData() {
        companyCompletedItemsPerMonth = null;
        companyAverageDaysInWorkflow = null;
    }

    const activeProjectsTableColumns: column<ActiveProjectsPerCompanyResponse>[] = [
        { itemKey: 'company', text: 'Company', sortKey: undefined },
        { itemKey: 'activeProjectCount', text: 'Active Projects', sortKey: undefined },
        { itemKey: 'lateProjectCount', text: 'Late Projects', sortKey: undefined },
        { itemKey: 'itemCount', text: 'Item Count', sortKey: undefined },
        { itemKey: 'largeItemCount', text: 'Large Item Count', sortKey: undefined },
        { itemKey: 'wordCount', text: 'Word Count', sortKey: undefined },
        { text: '', sortKey: undefined },
    ];

    function calculateCompletedItemsDataPoints(
        companyCompletedItemsPerMonth: CompanyCompletedItemsPerMonthResponse[],
        resourceSize: ResourceSize
    ) {
        return companyCompletedItemsPerMonth.map((responseItem) => ({
            x: responseItem.month,
            y:
                resourceSize === 'both'
                    ? responseItem.longResourceCount + responseItem.shortResourceCount
                    : resourceSize === 'short'
                      ? responseItem.shortResourceCount
                      : responseItem.longResourceCount,
        }));
    }

    function calculateAverageDaysInWorkflowLines(
        companyAverageDaysInWorkflow: CompanyAverageDaysInWorkflowResponse[],
        resourceSize: ResourceSize
    ) {
        return [
            {
                label: 'Days to Start',
                values: companyAverageDaysInWorkflow.map((responseItem) => ({
                    x: responseItem.month,
                    y:
                        resourceSize === 'both'
                            ? responseItem.daysToStart
                            : resourceSize === 'short'
                              ? responseItem.shortResourcesDaysToStart
                              : responseItem.longResourcesDaysToStart,
                })),
            },
            {
                label: 'Days with Partner',
                values: companyAverageDaysInWorkflow.map((responseItem) => ({
                    x: responseItem.month,
                    y:
                        resourceSize === 'both'
                            ? responseItem.daysWithPartner
                            : resourceSize === 'short'
                              ? responseItem.shortResourcesDaysWithPartner
                              : responseItem.longResourcesDaysWithPartner,
                })),
            },
            {
                label: 'Total Days',
                values: companyAverageDaysInWorkflow.map((responseItem) => ({
                    x: responseItem.month,
                    y:
                        resourceSize === 'both'
                            ? responseItem.daysTotal
                            : resourceSize === 'short'
                              ? responseItem.shortResourcesDaysTotal
                              : responseItem.longResourcesDaysTotal,
                })),
            },
        ];
    }
</script>

<div class="mb-4 flex h-full flex-col gap-4 {isShowing || 'hidden'}">
    <div class="flex flex-row gap-4 pt-4">
        <div class="flex max-h-[50vh] max-w-[calc(100%-27rem)] flex-grow flex-col rounded border p-4 pt-2 shadow-lg">
            <div class="pb-2 text-lg font-bold">Active Projects per Company</div>
            <Table
                class=""
                columns={activeProjectsTableColumns}
                items={activeProjectsPerCompany ?? []}
                idColumn="company"
                enableSelectAll={false}
                enableSelect={false}
                searchable={false}
                noItemsText="No active projects."
                isLoading={activeProjectsPerCompany === null}
                let:item
                let:itemKey
                let:columnText
            >
                {#if columnText === ''}
                    <td>
                        <ProjectProgressBar
                            class="!w-16"
                            notStartedCount={item.notStartedItemCount}
                            editorReviewCount={item.editorReviewItemCount}
                            inCompanyReviewCount={item.inCompanyReviewItemCount}
                            inPublisherReviewCount={item.inPublisherReviewItemCount}
                            completeCount={item.completedItemCount}
                            showLegend={false}
                        />
                    </td>
                {:else if itemKey}
                    <TableCell>{item[itemKey]?.toLocaleString() ?? ''}</TableCell>
                {/if}
            </Table>
        </div>
        <div class="flex w-full max-w-md flex-col gap-4">
            {#each reportingUiLinks.projects as link (link.reportLink)}
                <ReportingLink
                    reportTitle={link.reportTitle}
                    reportDescription={link.reportDescription}
                    reportLink={link.reportLink}
                />
            {/each}
        </div>
    </div>
    <div class="flex w-full flex-grow flex-col rounded border p-4 pt-2 shadow-lg">
        <div class="flex flex-row py-2">
            <Select
                class="select select-bordered me-4 max-w-xs"
                onChange={clearFetchedCompanyPerformanceMetricsData}
                options={companies
                    .filter((c) => !companiesToIgnore.includes(c.name))
                    .map((c) => ({ value: c.id, label: c.name }))}
                isNumber={true}
                bind:value={companyPerformanceMetricsCompanyId}
            />
            <Select
                class="select select-bordered me-4 max-w-xs"
                options={[
                    { value: 'both', label: 'All Resource Items' },
                    { value: 'short', label: 'Short Resource Items' },
                    { value: 'long', label: 'Long Resource Items' },
                ]}
                isNumber={false}
                bind:value={companyPerformanceMetricsResourceSize}
            />
        </div>
        <div class="flex min-h-40 flex-grow flex-row gap-4">
            <div class="flex w-full flex-col gap-2">
                <div class="text-lg font-bold">Total Completed Items</div>
                <div class="relative flex-1 overflow-x-hidden">
                    {#if activeProjectsPerCompany === null || companyCompletedItemsPerMonth === null}
                        <CenteredSpinner />
                    {:else}
                        <BarChart
                            dataPoints={calculateCompletedItemsDataPoints(
                                companyCompletedItemsPerMonth,
                                companyPerformanceMetricsResourceSize
                            )}
                            yLabel="Completed Items"
                        />
                    {/if}
                </div>
            </div>

            <div class="flex w-full flex-col gap-2">
                <div class="text-lg font-bold">Average Days in Workflow</div>
                <div class="relative flex-1 overflow-x-hidden">
                    {#if activeProjectsPerCompany === null || companyAverageDaysInWorkflow === null}
                        <CenteredSpinner />
                    {:else}
                        <LineChart
                            lines={calculateAverageDaysInWorkflowLines(
                                companyAverageDaysInWorkflow,
                                companyPerformanceMetricsResourceSize
                            )}
                        />
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

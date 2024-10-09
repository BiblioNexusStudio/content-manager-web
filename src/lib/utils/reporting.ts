import type { DynamicReport } from '$lib/types/reporting';

export const reportApiPaths = {
    activeProjectsByCompany: '/reports/dynamic/active-projects-by-company',
    monthlyCompletedItemsForCompany: '/reports/dynamic/monthly-completed-items-for-company',
    monthlyAverageDaysInWorkflowForCompany: '/reports/dynamic/monthly-average-days-in-workflow-for-company',
};

export const reportingUiLinks = {
    reports: [
        {
            reportTitle: 'Aquiferization Progress Tracking',
            reportDescription: 'Line chart tracking monthly Aquiferization starts and completions',
            reportLink: '/reporting/monthly-aquiferizations',
        },
        {
            reportTitle: 'Daily Resource Item Downloads',
            reportDescription: 'Bar chart showing daily Resource Item downloads',
            reportLink: '/reporting/daily-resource-item-requests',
        },
        {
            reportTitle: 'Recently Edited Resource Items',
            reportDescription: 'List of Resource Items edited in the last 30 days',
            reportLink: '/reporting/edited-last-thirty-days',
        },
        {
            reportTitle: 'Translation Progress Tracking',
            reportDescription: 'Line chart tracking monthly Translation starts and completions',
            reportLink: '/reporting/monthly-translations',
        },
        {
            reportTitle: 'Resource Items Downloaded',
            reportDescription: 'List of the most downloaded items for the last 30 days',
            reportLink: '/reporting/most-requested-resources',
        },
    ],
    projects: [
        {
            reportTitle: 'Monthly Translation by Company',
            reportDescription: 'Count of translated items & words',
            reportLink: '/reporting/translated-items-and-words-by-company',
        },
        {
            reportTitle: 'Recently Active Users',
            reportDescription: 'Aquifer Admin Project users active in the last month',
            reportLink: '/reporting/recently-active-users',
        },
        {
            reportTitle: 'Resource Types Published by Language',
            reportDescription: 'Count of items published in each language',
            reportLink: '/reporting/published-items-and-words-by-language',
        },
    ],
};

export function getAllReportingUiLinksAndApiPaths() {
    return Object.values(reportingUiLinks)
        .flatMap((category) => category)
        .map((r) => r.reportLink)
        .concat(Object.values(reportApiPaths));
}

export function convertPascalCaseToHumanReadable(columnName: string): string {
    return columnName
        .split(/(?=[A-Z])/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function convertDynamicReportToResponseObjects<T>(report: DynamicReport | null): T[] {
    return (
        report?.results.map((result) => {
            return report.columns.reduce((obj, column, index) => {
                const key = (column.charAt(0).toLowerCase() + column.slice(1)) as keyof T;
                obj[key] = result[index] as T[keyof T];
                return obj;
            }, {} as T);
        }) ?? []
    );
}

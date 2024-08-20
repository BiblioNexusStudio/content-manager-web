export interface IReportingLinkData {
    reportTitle: string;
    reportDescription: string;
    reportLink: string;
}

export function getReportingLinkData(): IReportingLinkData[] {
    return [
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
    ];
}

export function convertPascalCaseToHumanReadable(columnName: string): string {
    return columnName
        .split(/(?=[A-Z])/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

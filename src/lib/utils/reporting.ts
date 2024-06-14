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
            reportLink: '/reporting/aquiferizations',
        },
        {
            reportTitle: 'Daily Resource Item Downloads',
            reportDescription: 'Bar chart showing daily Resource Item downloads',
            reportLink: '/reporting/bar-charts/daily-resource-downloads',
        },
        {
            reportTitle: 'Recently Edited Resource Items',
            reportDescription: 'List of Resource Items edited in the last 30 days',
            reportLink: '/reporting/lists/edited-last-thirty-days',
        },
        {
            reportTitle: 'Translation Progress Tracking',
            reportDescription: 'Line chart tracking monthly Translation starts and completions',
            reportLink: '/reporting/translations',
        },
        {
            reportTitle: 'Resource Items Downloaded',
            reportDescription: 'List of the most downloaded items for the last 30 days',
            reportLink: '/reporting/lists/most-requested-resources',
        },
    ];
}

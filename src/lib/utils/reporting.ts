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
            reportDescription: 'Bar chart showing daily Resources Item downloads',
            reportLink: '/reporting/bar-charts/daily-resource-downloads',
        },
        {
            reportTitle: 'Recently Edited Resource Items',
            reportDescription: 'List of Resources Items edited in the last 30 days',
            reportLink: '/reporting/lists/recently-edited-resource-items',
        },
        {
            reportTitle: 'Translation Progress Tracking',
            reportDescription: 'Line chart tracking monthly Translation starts and completions',
            reportLink: '/reporting/translations',
        },
        {
            reportTitle: 'Resource Items Downloaded',
            reportDescription: 'List of the most downloaded items for the last 30 days',
            reportLink: '/reporting/lists/resource-items-downloaded',
        },
        {
            reportTitle: 'Resource Project Tracking',
            reportDescription: 'Summary data for recently completed Projects',
            reportLink: '/reporting/bar-charts/resource-project-tracking',
        },
    ];
}

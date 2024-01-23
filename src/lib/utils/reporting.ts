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
            reportLink: '/reporting/line-charts/aquiferization-progress-tracking',
        },
        {
            reportTitle: 'Daily Resource Item Downloads',
            reportDescription: 'Bar chart showing daily Resources Item downloads',
            reportLink: '/reporting/bar-charts/daily-resource-item-downloads',
        },
        {
            reportTitle: 'Recently Editied Resource Items',
            reportDescription: 'List of Resources Items edited in the last 30 days',
            reportLink: '/reporting/lists/recently-edited-resource-items',
        },
        {
            reportTitle: 'Translation Progress Tracking',
            reportDescription: 'Line chart tracking monthly Translation starts and completions',
            reportLink: '/reporting/line-charts/translation-progress-tracking',
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

export interface IReportSummaryCardData {
    reportTitle: string;
    reportTotal: string;
    monthTotal: string;
    monthText: string;
}

export function getMockReportSummaryCardData(): IReportSummaryCardData[] {
    return [
        {
            reportTitle: 'Total Resource Items',
            reportTotal: '24,211',
            monthTotal: '+275',
            monthText: 'This Month',
        },
        {
            reportTitle: 'Total Resource Items (non-English)',
            reportTotal: '747',
            monthTotal: '+33',
            monthText: 'This Month',
        },
        {
            reportTitle: 'Total Resource Items (2+ Languages)',
            reportTotal: '74',
            monthTotal: '+23',
            monthText: 'This Month',
        },
        {
            reportTitle: 'Resource Items being Aquiferized',
            reportTotal: '139',
            monthTotal: '56',
            monthText: 'Started this Month',
        },
        {
            reportTitle: 'Resource Items being Translated',
            reportTotal: '207',
            monthTotal: '15',
            monthText: 'Started this Month',
        },
    ];
}

import { ssp } from '$lib/utils/sveltekit-search-params';

export const _defaultTableRowsPerPage = 100;

export const _searchParamsConfig = {
    paginationStart: ssp.number(0),
    paginationEnd: ssp.number(_defaultTableRowsPerPage),
    languageId: ssp.number(0),
    parentResourceId: ssp.number(0),
    companyId: ssp.number(0),
    startDate: ssp.string(''),
    endDate: ssp.string(''),
    sort: ssp.string(''),
    report: ssp.string(''),
};

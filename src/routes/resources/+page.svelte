<script lang="ts">
    import type { PageData } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import { updateSearchParam, urlWithUpdatedSearchParam } from '$lib/utils/search-params';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { get } from 'svelte/store';
    import { unwrapStreamedData, unwrapStreamedDataWithCallback } from '$lib/utils/http-service';
    import type { ResourceListItemContentIdWithLanguageId } from './+page';

    export let data: PageData;

    let searchInputValue = get(data.searchQuery);

    let selectedLanguageId = data.selectedLanguageId;
    let selectedResourceId = data.selectedResourceId;
    let recordsPerPage = data.recordsPerPage;

    $: resourceList = unwrapStreamedData(data.streamedResourceList);

    let resourceListCount = 0;
    $: unwrapStreamedDataWithCallback(data.streamedResourceListCount, setResourceCount);

    function setResourceCount(count: number) {
        resourceListCount = count;
    }

    function getNormalizedStatus(status: string): { class: string; value: string } {
        switch (status) {
            case 'NotStarted': {
                return {
                    class: 'badge-neutral font-semibold',
                    value: $translate('page.resources.table.statuses.notStarted.value'),
                };
            }
            case 'InProgress': {
                return {
                    class: 'badge-primary bg-[#B9EBFE] text-primary font-semibold',
                    value: $translate('page.resources.table.statuses.inProgress.value'),
                };
            }
            case 'Completed': {
                return {
                    class: 'badge-success bg-[#ABEFC6] text-success font-semibold',
                    value: $translate('page.resources.table.statuses.completed.value'),
                };
            }
            default: {
                return {
                    class: 'badge-info font-semibold',
                    value: $translate('page.resources.table.statuses.none.value'),
                };
            }
        }
    }

    function calculateContentId(contentIdsWithLanguageIds: ResourceListItemContentIdWithLanguageId[]) {
        if ($selectedLanguageId) {
            const contentId = contentIdsWithLanguageIds.find(
                ({ languageId }) => languageId === $selectedLanguageId
            )?.contentId;
            if (contentId) {
                return contentId;
            }
        }

        const englishContentId = contentIdsWithLanguageIds.find(({ languageId }) => languageId === 1)?.contentId;
        if (englishContentId) {
            return englishContentId;
        }

        return contentIdsWithLanguageIds[0]!.contentId;
    }

    $: totalPages = Math.ceil(resourceListCount / get(data.recordsPerPage)) || 1;
</script>

<div class="mx-4 flex h-[95vh] flex-col pt-0 lg:h-screen lg:pt-4">
    <div class="text-3xl">{$translate('page.resources.header.value')}</div>
    <div class="grid grid-cols-2">
        <div class="mb-6 mt-4">
            <span>
                <select
                    bind:value={$selectedLanguageId}
                    class="select select-bordered me-2 w-2/6 max-w-xs bg-base-200 pe-14 ps-4"
                >
                    <option value={0} selected>{$translate('page.resources.dropdowns.allLanguages.value')}</option>
                    {#each data.languages as language}
                        <option value={language.id}>{language.englishDisplay}</option>
                    {/each}
                </select>
            </span>
            <span>
                <select
                    bind:value={$selectedResourceId}
                    class="select select-bordered w-2/6 max-w-xs bg-base-200 pe-14 ps-4"
                >
                    <option value={0} selected>{$translate('page.resources.dropdowns.allResources.value')}</option>
                    {#each data.resourceTypes as resourceType}
                        <option value={resourceType.id}>{resourceType.displayName}</option>
                    {/each}
                </select>
            </span>
        </div>
        <div class="mb-6 mt-4 grid">
            <div class="relative w-1/2 justify-self-end text-gray-600">
                <span class="absolute inset-y-0 left-0 flex items-center ps-2">
                    <button
                        type="submit"
                        class="p-1"
                        on:click={() => updateSearchParam(data.searchQuery, searchInputValue)}
                    >
                        <svg
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            viewBox="0 0 24 24"
                            class="h-6 w-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg
                        >
                    </button>
                </span>
                <input
                    bind:value={searchInputValue}
                    on:keypress={(e) => {
                        if (e.key === 'Enter') updateSearchParam(data.searchQuery, searchInputValue);
                    }}
                    type="search"
                    class="min-h-12 w-full rounded-md border-[1px] py-2 ps-10 text-sm text-gray-900 focus:outline-none"
                    placeholder={$translate('page.resources.searchBox.value')}
                />
            </div>
        </div>
    </div>

    <div class="flex-1 overflow-auto rounded-md rounded-b-none border-[1px]">
        {#await resourceList}
            <CenteredSpinner />
        {:then resourceList}
            <table class="table table-pin-rows">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="w-[40%]">{$translate('page.resources.table.nameHeader.value')}</th>
                        <th class="w-[40%]">{$translate('page.resources.table.typeHeader.value')}</th>
                        <th class="w-[20%]">{$translate('page.resources.table.statusHeader.value')}</th>
                    </tr>
                </thead>
                <tbody>
                    {#each resourceList as resource}
                        {@const normalizedStatus = getNormalizedStatus(resource.status)}
                        {@const contentId = calculateContentId(resource.contentIdsWithLanguageIds)}
                        <tr class="hover">
                            <LinkedTableCell href={`/resources/${contentId}`}>
                                {resource.englishLabel}
                            </LinkedTableCell>
                            <LinkedTableCell href={`/resources/${contentId}`}>
                                {resource.parentResourceName}
                            </LinkedTableCell>
                            <LinkedTableCell href={`/resources/${contentId}`}>
                                <div class="badge {normalizedStatus.class}">{normalizedStatus.value}</div>
                            </LinkedTableCell>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/await}
    </div>
    <div class="mb-2 grid grid-cols-3 rounded-md rounded-t-none border-[1px] border-t-0 p-2">
        <a
            class="btn btn-outline self-center justify-self-start"
            class:btn-disabled={get(data.currentPage) === 1}
            href={urlWithUpdatedSearchParam(data.currentPage, get(data.currentPage) - 1)}
            >{$translate('page.resources.table.navigation.previous.value')}</a
        >
        <div class="grid place-self-center">
            <div class="mb-2">
                {$translate('page.resources.table.navigation.pageNumber.value', {
                    values: {
                        currentPage: get(data.currentPage),
                        totalPages,
                    },
                })}
            </div>
            <select bind:value={$recordsPerPage} class="select select-bordered select-ghost select-xs">
                {#each [10, 50, 100] as count, i}
                    <option value={count} selected={i === 0}>
                        {`${count} ${$translate('page.resources.table.navigation.perPage.value')}`}
                    </option>
                {/each}
            </select>
        </div>
        <a
            class="btn btn-outline self-center justify-self-end"
            class:btn-disabled={get(data.currentPage) === totalPages}
            href={urlWithUpdatedSearchParam(data.currentPage, get(data.currentPage) + 1)}
            >{$translate('page.resources.table.navigation.next.value')}</a
        >
    </div>
</div>

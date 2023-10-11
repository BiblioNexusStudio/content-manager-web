<script lang="ts">
    import type { PageData } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import PencilIcon from '$lib/icons/PencilIcon.svelte';
    import type { ResourceListItem } from './+page';
    import { goto } from '$app/navigation';

    export let data: PageData;

    let recordCount = 0;
    let selectedLanguage: string = '0';
    let selectedResource: string = '0';
    let searchQuery: string = '';
    let searchInputValue: string;
    let currentPage = 1;
    let recordsPerPage = '10';
    let resourceList: ResourceListItem[] = [];

    const onPageChange = async (currentPage: number, recordsPerPage: string) => {
        resourceList = await data.getResourceList(
            currentPage,
            +recordsPerPage,
            +selectedLanguage,
            +selectedResource,
            searchQuery
        );
    };

    const onFilterChange = async (selectedLanguage: number, selectedResource: number, searchQuery: string) => {
        currentPage = 1;

        [resourceList, recordCount] = await Promise.all([
            data.getResourceList(currentPage, +recordsPerPage, +selectedLanguage, +selectedResource, searchQuery),
            data.getResourceListCount(+selectedLanguage, +selectedResource, searchQuery),
        ]);
    };

    const getNormalizedStatus = (status: string): { class: string; value: string } => {
        switch (status) {
            case 'NotStarted': {
                return { class: 'badge-neutral', value: $translate('page.resources.table.statuses.notStarted.value') };
            }
            case 'InProgress': {
                return { class: 'badge-warning', value: $translate('page.resources.table.statuses.inProgress.value') };
            }
            case 'Completed': {
                return { class: 'badge-success', value: $translate('page.resources.table.statuses.completed.value') };
            }
            default: {
                return { class: 'badge-info', value: $translate('page.resources.table.statuses.none.value') };
            }
        }
    };

    $: totalPages = Math.ceil(recordCount / +recordsPerPage) || 1;
    $: onPageChange(currentPage, recordsPerPage);
    $: onFilterChange(+selectedLanguage, +selectedResource, searchQuery);
</script>

<div class="flex flex-col mx-4 h-screen">
    <div class="text-3xl mt-4">{$translate('page.resources.header.value')}</div>
    <div class="grid grid-cols-2">
        <div class="mt-4 mb-6">
            <span>
                <select bind:value={selectedLanguage} class="select select-bordered w-2/6 max-w-xs mr-2">
                    <option value="0" selected>{$translate('page.resources.dropdowns.allLanguages.value')}</option>
                    {#each data.languages as language}
                        <option value={language.id}>{language.englishDisplay}</option>
                    {/each}
                </select>
            </span>
            <span>
                <select bind:value={selectedResource} class="select select-bordered w-2/6 max-w-xs">
                    <option value="0" selected>{$translate('page.resources.dropdowns.allResources.value')}</option>
                    {#each data.resourceTypes as resourceType}
                        <option value={resourceType.id}>{resourceType.displayName}</option>
                    {/each}
                </select>
            </span>
        </div>
        <div class="mt-4 mb-6 grid">
            <div class="relative text-gray-600 w-1/2 justify-self-end">
                <span class="absolute inset-y-0 left-0 flex items-center pl-2">
                    <button type="submit" class="p-1" on:click={() => (searchQuery = searchInputValue)}>
                        <svg
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            viewBox="0 0 24 24"
                            class="w-6 h-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg
                        >
                    </button>
                </span>
                <input
                    bind:value={searchInputValue}
                    on:keypress={(e) => {
                        if (e.key === 'Enter') searchQuery = searchInputValue;
                    }}
                    type="search"
                    class="py-2 text-sm rounded-md pl-10 focus:outline-none text-gray-900 border-[1px] min-h-12 w-full"
                    placeholder={$translate('page.resources.searchBox.value')}
                />
            </div>
        </div>
    </div>

    <div class="overflow-auto flex-1 border-[1px] rounded-md rounded-b-none">
        <table class="table table-pin-rows">
            <thead>
                <tr class="bg-gray-100">
                    <th class="w-[40%]">{$translate('page.resources.table.nameHeader.value')}</th>
                    <th class="w-[40%]">{$translate('page.resources.table.typeHeader.value')}</th>
                    <th class="w-[18%]">{$translate('page.resources.table.statusHeader.value')}</th>
                    <th class="w-[2%] grid justify-items-end">
                        <select bind:value={recordsPerPage} class="select select-bordered select-xs select-ghost">
                            <option value="10" selected>10</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </th>
                </tr>
            </thead>
            <tbody>
                {#each resourceList as resource}
                    {@const normalizedStatus = getNormalizedStatus(resource.status)}
                    <tr class="hover">
                        <td>{resource.name}</td>
                        <td>{resource.type}</td>
                        <td><div class="badge {normalizedStatus.class}">{normalizedStatus.value}</div></td>
                        <td class="w-4"
                            ><button on:click={() => goto(`/resources/${resource.id}`)} class="btn btn-sm btn-link"
                                ><PencilIcon /></button
                            ></td
                        >
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="grid grid-cols-3 p-4 mb-2 border-[1px] border-t-0 rounded-md rounded-t-none">
        <button
            class="btn btn-outline justify-self-start"
            class:btn-disabled={currentPage === 1}
            on:click={() => currentPage--}>{$translate('page.resources.table.navigation.previous.value')}</button
        >
        <div class="place-self-center">
            {$translate('page.resources.table.navigation.pageNumber.value', {
                values: {
                    currentPage,
                    totalPages,
                },
            })}
        </div>
        <button
            class="btn btn-outline justify-self-end"
            class:btn-disabled={currentPage === totalPages}
            on:click={() => currentPage++}>{$translate('page.resources.table.navigation.next.value')}</button
        >
    </div>
</div>

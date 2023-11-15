<script lang="ts">
    import type { PageData, Snapshot } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import PencilIcon from '$lib/icons/PencilIcon.svelte';
    import type { Language, ResourceListItem, ResourceType } from './+page';
    import { goto } from '$app/navigation';
    import { onMount, tick } from 'svelte';

    export let data: PageData;

    let loadedFromSnapshot = false;
    let waitingForMount = true;
    let recordCount = 0;
    let selectedLanguage = '0';
    let selectedResource = '0';
    let searchQuery = '';
    let searchInputValue: string;
    let currentPage = 1;
    let recordsPerPage = 10;
    let resourceList: ResourceListItem[] = [];
    let languages: Language[] = [];
    let resourceTypes: ResourceType[] = [];

    const onPageChange = async () => {
        if (waitingForMount) return;

        resourceList = await data.getResourceList(
            currentPage,
            recordsPerPage,
            +selectedLanguage,
            +selectedResource,
            searchQuery
        );
    };

    const onFilterChange = async () => {
        if (waitingForMount) return;

        currentPage = 1;
        [resourceList, recordCount] = await Promise.all([
            data.getResourceList(currentPage, +recordsPerPage, +selectedLanguage, +selectedResource, searchQuery),
            data.getResourceListCount(+selectedLanguage, +selectedResource, searchQuery),
        ]);
    };

    const getNormalizedStatus = (status: string): { class: string; value: string } => {
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
    };

    $: snapshotValues = {
        currentPage,
        recordsPerPage,
        selectedLanguage,
        selectedResource,
        searchQuery,
        searchInputValue,
        resourceList,
        recordCount,
        languages,
        resourceTypes,
    };
    $: totalPages = Math.ceil(recordCount / recordsPerPage) || 1;
    $: [currentPage, recordsPerPage] && onPageChange();
    $: [selectedLanguage, selectedResource, searchQuery] && onFilterChange();

    onMount(async () => {
        // Snapshot randomly runs before or after onMount, and this makes sure it's ran
        await tick();

        waitingForMount = false;
        if (!loadedFromSnapshot) {
            [languages, resourceTypes] = await Promise.all([
                data.getLanguages(),
                data.getResourceTypes(),
                onPageChange(),
                onFilterChange(),
            ]);
        }
    });

    export const snapshot: Snapshot = {
        capture: () => snapshotValues,
        restore: (value) => {
            if (value.resourceList.length === 0) return;
            ({
                currentPage,
                recordsPerPage,
                selectedLanguage,
                selectedResource,
                searchQuery,
                searchInputValue,
                resourceList,
                recordCount,
                languages,
                resourceTypes,
            } = value);

            loadedFromSnapshot = true;
        },
    };
</script>

<div class="mx-4 flex h-[95vh] flex-col pt-0 lg:h-screen lg:pt-4">
    <div class="text-3xl">{$translate('page.resources.header.value')}</div>
    <div class="grid grid-cols-2">
        <div class="mb-6 mt-4">
            <span>
                <select
                    bind:value={selectedLanguage}
                    class="select select-bordered me-2 w-2/6 max-w-xs bg-base-200 pe-14 ps-4"
                >
                    <option value="0" selected>{$translate('page.resources.dropdowns.allLanguages.value')}</option>
                    {#each languages as language}
                        <option value={language.id}>{language.englishDisplay}</option>
                    {/each}
                </select>
            </span>
            <span>
                <select
                    bind:value={selectedResource}
                    class="select select-bordered w-2/6 max-w-xs bg-base-200 pe-14 ps-4"
                >
                    <option value="0" selected>{$translate('page.resources.dropdowns.allResources.value')}</option>
                    {#each resourceTypes as resourceType}
                        <option value={resourceType.id}>{resourceType.displayName}</option>
                    {/each}
                </select>
            </span>
        </div>
        <div class="mb-6 mt-4 grid">
            <div class="relative w-1/2 justify-self-end text-gray-600">
                <span class="absolute inset-y-0 left-0 flex items-center ps-2">
                    <button type="submit" class="p-1" on:click={() => (searchQuery = searchInputValue)}>
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
                        if (e.key === 'Enter') searchQuery = searchInputValue;
                    }}
                    type="search"
                    class="min-h-12 w-full rounded-md border-[1px] py-2 ps-10 text-sm text-gray-900 focus:outline-none"
                    placeholder={$translate('page.resources.searchBox.value')}
                />
            </div>
        </div>
    </div>

    <div class="flex-1 overflow-auto rounded-md rounded-b-none border-[1px]">
        <table class="table table-pin-rows">
            <thead>
                <tr class="bg-gray-100">
                    <th class="w-[40%]">{$translate('page.resources.table.nameHeader.value')}</th>
                    <th class="w-[40%]">{$translate('page.resources.table.typeHeader.value')}</th>
                    <th class="w-[18%]">{$translate('page.resources.table.statusHeader.value')}</th>
                    <th class="grid w-[2%] justify-items-end" />
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
                            ><button
                                on:click={() => goto(`/resources/${resource.id}`)}
                                class="btn btn-link btn-sm text-neutral"><PencilIcon /></button
                            ></td
                        >
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="mb-2 grid grid-cols-3 rounded-md rounded-t-none border-[1px] border-t-0 p-2">
        <button
            class="btn btn-outline self-center justify-self-start"
            class:btn-disabled={currentPage === 1}
            on:click={() => currentPage--}>{$translate('page.resources.table.navigation.previous.value')}</button
        >
        <div class="grid place-self-center">
            <div class="mb-2">
                {$translate('page.resources.table.navigation.pageNumber.value', {
                    values: {
                        currentPage,
                        totalPages,
                    },
                })}
            </div>
            <select bind:value={recordsPerPage} class="select select-bordered select-ghost select-xs">
                {#each [10, 50, 100] as count, i}
                    <option value={count} selected={i === 0}>
                        {`${count} ${$translate('page.resources.table.navigation.perPage.value')}`}
                    </option>
                {/each}
            </select>
        </div>
        <button
            class="btn btn-outline self-center justify-self-end"
            class:btn-disabled={currentPage === totalPages}
            on:click={() => currentPage++}>{$translate('page.resources.table.navigation.next.value')}</button
        >
    </div>
</div>

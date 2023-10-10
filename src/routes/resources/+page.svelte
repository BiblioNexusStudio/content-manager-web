<script lang="ts">
    import type { PageData } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import PencilIcon from '$lib/icons/PencilIcon.svelte';
    import type { ResourceListItem } from './+page';
    import { goto } from '$app/navigation';

    export let data: PageData;

    const defaultSelection = 'default';

    let selectedLanguage: string = defaultSelection;
    let selectedResource: string = defaultSelection;
    let currentPage = 0;
    let recordsPerPage = 10;
    let resourceList: ResourceListItem[] = [];

    $: data.getResourceList(currentPage, recordsPerPage, '').then((r) => (resourceList = r));
</script>

<div class="grid grid-cols-2 mx-4">
    <div class="col-span-2 text-3xl mt-4">{$translate('page.resources.header.value')}</div>
    <div class="mt-4 mb-6">
        <span>
            <select bind:value={selectedLanguage} class="select select-bordered w-2/6 max-w-xs mr-2">
                <option value="default" selected>{$translate('page.resources.dropdowns.allLanguages.value')}</option>
                {#each data.languages as language}
                    <option value={language.id}>{language.englishDisplay}</option>
                {/each}
            </select>
        </span>
        <span>
            <select bind:value={selectedResource} class="select select-bordered w-2/6 max-w-xs">
                <option value="default" selected>{$translate('page.resources.dropdowns.allResources.value')}</option>
                {#each data.resourceTypes as resourceType}
                    <option value={resourceType.id}>{resourceType.displayName}</option>
                {/each}
            </select>
        </span>
    </div>
    <div class="mt-4 mb-6 grid">
        <div class="relative text-gray-600 w-1/2 justify-self-end">
            <span class="absolute inset-y-0 left-0 flex items-center pl-2">
                <button type="submit" class="p-1">
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
                type="search"
                name="q"
                class="py-2 text-sm rounded-md pl-10 focus:outline-none text-gray-900 border-[1px] min-h-12 w-full"
                placeholder={$translate('page.resources.searchBox.value')}
            />
        </div>
    </div>

    <div class="col-span-2 overflow-x-auto border-[1px] rounded-md">
        <table class="table">
            <!-- head -->
            <thead class="bg-gray-100">
                <tr>
                    <th>{$translate('page.resources.table.nameHeader.value')}</th>
                    <th>{$translate('page.resources.table.typeHeader.value')}</th>
                    <th>{$translate('page.resources.table.statusHeader.value')}</th>
                    <th />
                </tr>
            </thead>
            <tbody>
                {#each resourceList as resource}
                    <tr class="hover">
                        <th>{resource.name}</th>
                        <td>{resource.type}</td>
                        <td><div class="badge badge-success">{resource.status}</div></td>
                        <td class="w-4"
                            ><button on:click={() => goto(`/resources/${resource.id}`)} class="btn btn-sm btn-link"
                                ><PencilIcon /></button
                            ></td
                        >
                    </tr>
                {/each}
            </tbody>
        </table>
        <div class="grid grid-cols-3 border-t-[1px] p-4">
            <button class="btn btn-outline justify-self-start"
                >{$translate('page.resources.table.navigation.previous.value')}</button
            >
            <div class="place-self-center">
                {$translate('page.resources.table.navigation.pageNumber.value', {
                    values: {
                        currentPage: 0,
                        totalPages: 20,
                    },
                })}
            </div>
            <button class="btn btn-outline justify-self-end"
                >{$translate('page.resources.table.navigation.next.value')}</button
            >
        </div>
    </div>
</div>

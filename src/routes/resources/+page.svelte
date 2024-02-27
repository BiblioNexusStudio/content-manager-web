<script lang="ts">
    import type { PageData } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { unwrapStreamedData, unwrapStreamedDataWithCallback } from '$lib/utils/http-service';
    import { _searchParamsConfig } from './+page';
    import { searchParameters } from '$lib/utils/sveltekit-search-params';
    import { resourcesPerPage } from '$lib/stores/resources';
    import { invalidateAll } from '$app/navigation';
    import { enterKeyHandler } from '$lib/utils/enter-key-action';
    import Select from '$lib/components/Select.svelte';
    import { numbersRangeToString, parseStartAndEndFromSingleOrRangeString } from '$lib/utils/number-list-parser';
    import LinkedTableRow from '$lib/components/LinkedTableRow.svelte';
    import type { Bible } from '$lib/types/base';

    export let data: PageData;

    const searchParams = searchParameters(_searchParamsConfig);

    $: resourceContentDataPromise =
        data.streamedResourceContentData === null
            ? Promise.resolve(null)
            : unwrapStreamedData(data.streamedResourceContentData);

    $: biblesPromise = unwrapStreamedDataWithCallback(data.bibles, (fetched) => (bibles = fetched));

    let bibles: Bible[] | null = null;

    let searchInputValue = $searchParams.query;
    let languageId = $searchParams.languageId;
    let parentResourceId = $searchParams.resourceId;
    let bookCode = $searchParams.bookCode === '' ? null : $searchParams.bookCode;
    let isPublished = $searchParams.isPublished === '' ? null : $searchParams.isPublished;
    let publishedChecked = isPublished === null || isPublished === 'true';
    let unpublishedChecked = isPublished === null || isPublished === 'false';

    let chapterRange = '';
    $: calculateChapterRange(bibles);

    $: parsedRange = parseStartAndEndFromSingleOrRangeString(chapterRange, 1, calculateMaxChapter(bibles));
    $: invalidChapterRange = !!chapterRange && parsedRange.start === 0 && parsedRange.end === 0;

    let isInitialResourcePerPage = true;

    $: canApplyFilters =
        (!!searchInputValue ||
            languageId > 0 ||
            parentResourceId > 0 ||
            !!bookCode ||
            !!chapterRange ||
            !publishedChecked ||
            !unpublishedChecked) &&
        !invalidChapterRange;

    $: {
        // track whether resourcesPerPage has changed
        const _deps = [$resourcesPerPage];
        if (isInitialResourcePerPage) {
            isInitialResourcePerPage = false;
        } else {
            invalidateAll();
            resourceContentDataPromise = new Promise<null>(() => {
                // do nothing, and wait for resourceContentDataPromise to be refetched.
            });
        }
    }

    async function applyFilters() {
        if (canApplyFilters) {
            const newIsPublished = !publishedChecked ? 'false' : !unpublishedChecked ? 'true' : '';
            const newBookCode = bookCode || '';
            if (
                $searchParams.query !== searchInputValue ||
                $searchParams.languageId !== languageId ||
                $searchParams.resourceId !== parentResourceId ||
                $searchParams.bookCode !== newBookCode ||
                $searchParams.startChapter !== parsedRange.start ||
                $searchParams.endChapter !== parsedRange.end ||
                $searchParams.isPublished !== newIsPublished
            ) {
                $searchParams.page = 1;
                $searchParams.query = searchInputValue;
                $searchParams.languageId = languageId;
                $searchParams.resourceId = parentResourceId;
                $searchParams.bookCode = newBookCode;
                $searchParams.startChapter = parsedRange.start;
                $searchParams.endChapter = parsedRange.end;
                $searchParams.isPublished = newIsPublished;
            }
        }
    }

    function calculateTotalPages(totalResourceContents: number) {
        return Math.ceil(totalResourceContents / $resourcesPerPage) || 1;
    }

    function calculateChapterRange(bibles: Bible[] | null) {
        chapterRange = numbersRangeToString(
            $searchParams.startChapter,
            $searchParams.endChapter,
            1,
            calculateMaxChapter(bibles)
        );
    }

    function calculateMaxChapter(bibles: Bible[] | null) {
        return bibles?.[0]?.books.find((b) => b.bookCode === bookCode)?.chapterCount ?? 0;
    }
</script>

{#await biblesPromise}
    <CenteredSpinner />
{:then bibles}
    <div class="flex h-[95vh] flex-col pt-0 lg:h-screen lg:pt-4">
        <div class="mx-4 text-3xl">{$translate('page.resources.header.value')}</div>
        <div class="flex flex-row space-x-2 overflow-x-scroll px-4 py-2">
            <Select
                bind:value={languageId}
                isNumber={true}
                class="select select-bordered min-w-[8rem] flex-grow"
                options={[
                    { value: 0, label: $translate('page.resources.dropdowns.allLanguages.value') },
                    ...data.languages.map((l) => ({ value: l.id, label: l.englishDisplay })),
                ]}
            />
            <Select
                bind:value={parentResourceId}
                isNumber={true}
                class="select select-bordered min-w-[10rem] flex-grow"
                options={[
                    { value: 0, label: $translate('page.resources.dropdowns.allResources.value') },
                    ...data.resourceTypes.map((t) => ({ value: t.id, label: t.displayName })),
                ]}
            />
            <Select
                class="select select-bordered min-w-[9rem] flex-grow"
                options={[
                    { value: null, label: 'Select Book' },
                    ...(bibles[0]?.books || []).map((b) => ({ value: b.bookCode, label: b.displayName })),
                ]}
                onChange={() => (chapterRange = '')}
                bind:value={bookCode}
            />
            <input
                disabled={!bookCode}
                bind:value={chapterRange}
                use:enterKeyHandler={applyFilters}
                class="input input-bordered input-md w-[11rem]"
                placeholder="Chapter (e.g. 2, 1-5)"
            />
            <div class="flex flex-col space-y-2">
                <div class="form-control">
                    <label class="label cursor-pointer py-0">
                        <span class="label-text text-xs">Published</span>
                        <input
                            disabled={!unpublishedChecked}
                            type="checkbox"
                            bind:checked={publishedChecked}
                            class="checkbox no-animation checkbox-sm ms-2"
                        />
                    </label>
                </div>
                <div class="form-control">
                    <label class="label cursor-pointer py-0">
                        <span class="label-text text-xs">Unpublished</span>
                        <input
                            disabled={!publishedChecked}
                            type="checkbox"
                            bind:checked={unpublishedChecked}
                            class="checkbox no-animation checkbox-sm ms-2"
                        />
                    </label>
                </div>
            </div>
            <input
                bind:value={searchInputValue}
                use:enterKeyHandler={applyFilters}
                class="input input-bordered input-md min-w-[8rem] flex-grow"
                placeholder={$translate('page.resources.searchBox.value')}
            />
            <button class="btn btn-primary" disabled={!canApplyFilters} on:click={applyFilters}>Apply</button>
        </div>

        {#await resourceContentDataPromise}
            <CenteredSpinner />
        {:then resourceContentsOrNull}
            <div class="mx-4 flex-1 overflow-auto rounded-md rounded-b-none border-[1px]">
                <table class="table table-pin-rows">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="w-[30%]">{$translate('page.resources.table.nameHeader.value')}</th>
                            <th class="w-[20%]">{$translate('page.resources.table.typeHeader.value')}</th>
                            <th class="w-[20%]">{$translate('page.resources.table.languageHeader.value')}</th>
                            <th class="w-[20%]">{$translate('page.resources.table.statusHeader.value')}</th>
                            <th class="w-[10%]">{$translate('page.resources.table.publishedHeader.value')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#if resourceContentsOrNull}
                            {#each resourceContentsOrNull.resourceContents as resourceContent (resourceContent.id)}
                                <LinkedTableRow
                                    href={`/resources/${resourceContent.id}`}
                                    cellValues={[
                                        resourceContent.englishLabel,
                                        resourceContent.parentResourceName,
                                        resourceContent.languageEnglishDisplay,
                                        resourceContent.status,
                                        resourceContent.isPublished ? 'Yes' : 'No',
                                    ]}
                                />
                            {:else}
                                <tr>
                                    <td colspan="99" class="text-center">No results found.</td>
                                </tr>
                            {/each}
                        {:else}
                            <tr>
                                <td colspan="99" class="text-center">Select filters or Search. Then click "Apply".</td>
                            </tr>
                        {/if}
                    </tbody>
                </table>
            </div>
            {#if resourceContentsOrNull}
                <div class="mx-4 mb-2 grid grid-cols-3 rounded-md rounded-t-none border-[1px] border-t-0 p-2">
                    <a
                        class="btn btn-outline self-center justify-self-start"
                        class:btn-disabled={$searchParams.page === 1}
                        href={searchParams.calculateUrlWithGivenChanges({ page: $searchParams.page - 1 })}
                        >{$translate('page.resources.table.navigation.previous.value')}</a
                    >
                    <div class="grid place-self-center">
                        <div class="mb-2">
                            {$translate('page.resources.table.navigation.pageNumber.value', {
                                values: {
                                    currentPage: $searchParams.page,
                                    totalPages: calculateTotalPages(resourceContentsOrNull.total),
                                },
                            })}
                        </div>
                        <select bind:value={$resourcesPerPage} class="select select-bordered select-ghost select-xs">
                            {#each [10, 50, 100] as count, i (i)}
                                <option value={count} selected={i === 0}>
                                    {`${count} ${$translate('page.resources.table.navigation.perPage.value')}`}
                                </option>
                            {/each}
                        </select>
                    </div>
                    <a
                        class="btn btn-outline self-center justify-self-end"
                        class:btn-disabled={$searchParams.page === calculateTotalPages(resourceContentsOrNull.total)}
                        href={searchParams.calculateUrlWithGivenChanges({ page: $searchParams.page + 1 })}
                        >{$translate('page.resources.table.navigation.next.value')}</a
                    >
                </div>
            {/if}
        {/await}
    </div>
{/await}

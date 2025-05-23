<script lang="ts">
    import type { PageData } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { _searchParamsConfig } from './+page';
    import { searchParameters } from '$lib/utils/sveltekit-search-params';
    import { resourcesPerPage } from '$lib/stores/resources';
    import { invalidateAll } from '$app/navigation';
    import { enterKeyHandler } from '$lib/utils/enter-key-action';
    import Select from '$lib/components/Select.svelte';
    import { numbersRangeToString, parseStartAndEndFromSingleOrRangeString } from '$lib/utils/number-list-parser';
    import { type BibleBook } from '$lib/types/base';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import { Icon } from 'svelte-awesome';
    import { volumeUp } from 'svelte-awesome/icons';
    import { Permission, userCan } from '$lib/stores/auth';

    interface PageProps {
        data: PageData;
    }

    let { data }: PageProps = $props();

    const searchParams = searchParameters(_searchParamsConfig, { runLoadAgainWhenParamsChange: true });

    let resourceContentDataPromise = $derived(
        data.resourceContentData === null ? Promise.resolve(null) : data.resourceContentData.promise
    );

    let bibleBooks = $derived(data.bibleBooks);

    let searchInputValue = $state($searchParams.query);
    let languageId = $state($searchParams.languageId);
    let parentResourceId = $state($searchParams.resourceId);
    let bookCode = $state($searchParams.bookCode === '' ? null : $searchParams.bookCode);
    let isNotApplicable = $state($searchParams.isNotApplicable === 'true' ? true : false);
    let isPublished = $state($searchParams.isPublished === 'true' ? true : false);
    let shouldShowNotApplicable = $userCan(Permission.PublishContent);

    let chapterRange = $state('');
    $effect(() => calculateChapterRange(bibleBooks));

    let parsedRange = $derived(
        parseStartAndEndFromSingleOrRangeString(chapterRange, 1, calculateMaxChapter(bibleBooks))
    );
    let invalidChapterRange = $derived(!!chapterRange && parsedRange.start === 0 && parsedRange.end === 0);

    let canApplyFilters = $derived(
        (!!searchInputValue ||
            languageId > 0 ||
            parentResourceId > 0 ||
            !!bookCode ||
            !!chapterRange ||
            isNotApplicable ||
            isPublished) &&
            !invalidChapterRange
    );

    function applyFilters() {
        if (canApplyFilters) {
            const newIsNotApplicable = isNotApplicable ? 'true' : '';
            const newIsPublished = isPublished ? 'true' : '';
            const newBookCode = bookCode || '';

            if (
                $searchParams.query !== searchInputValue ||
                $searchParams.languageId !== languageId ||
                $searchParams.resourceId !== parentResourceId ||
                $searchParams.bookCode !== newBookCode ||
                $searchParams.startChapter !== parsedRange.start ||
                $searchParams.endChapter !== parsedRange.end ||
                $searchParams.isNotApplicable !== newIsNotApplicable ||
                $searchParams.isPublished !== newIsPublished
            ) {
                $searchParams.page = 1;
                $searchParams.query = searchInputValue;
                $searchParams.languageId = languageId;
                $searchParams.resourceId = parentResourceId;
                $searchParams.bookCode = newBookCode;
                $searchParams.startChapter = parsedRange.start;
                $searchParams.endChapter = parsedRange.end;
                $searchParams.isNotApplicable = newIsNotApplicable;
                $searchParams.isPublished = newIsPublished;
            }
        }
    }

    function calculateTotalPages(totalResourceContents: number) {
        return Math.ceil(totalResourceContents / $resourcesPerPage) || 1;
    }

    function calculateChapterRange(bibleBooks: BibleBook[]) {
        chapterRange = numbersRangeToString(
            $searchParams.startChapter,
            $searchParams.endChapter,
            1,
            calculateMaxChapter(bibleBooks)
        );
    }

    function calculateMaxChapter(bibleBooks: BibleBook[]) {
        return bibleBooks.find((b) => b.code === bookCode)?.totalChapters ?? 0;
    }
</script>

<svelte:head>
    <title>Resources | Aquifer Admin</title>
</svelte:head>

<div class="flex h-full flex-col overflow-hidden pt-0 lg:pt-4">
    <div class="mx-4 text-3xl">{$translate('page.resources.header.value')}</div>
    <div class="flex shrink-0 flex-row space-x-2 overflow-x-auto px-4 py-2">
        <Select
            appInsightsEventName="resources-languages-filter-selection"
            bind:value={languageId}
            isNumber={true}
            class="select select-bordered min-w-[8rem] grow"
            options={[
                { value: 0, label: $translate('page.resources.dropdowns.allLanguages.value') },
                ...data.languages.map((l) => ({ value: l.id, label: l.englishDisplay })),
            ]}
        />
        <Select
            appInsightsEventName="resources-resources-filter-selection"
            bind:value={parentResourceId}
            isNumber={true}
            class="select select-bordered min-w-[10rem] grow"
            options={[
                { value: 0, label: $translate('page.resources.dropdowns.allResources.value') },
                ...data.parentResources.map((t) => ({ value: t.id, label: t.displayName })),
            ]}
        />
        <Select
            appInsightsEventName="resources-book-filter-selection"
            class="select select-bordered min-w-[9rem] grow"
            options={[
                { value: null, label: 'Select Book' },
                ...(bibleBooks || []).map((b) => ({ value: b.code, label: b.localizedName })),
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
        <div class={shouldShowNotApplicable ? 'flex flex-col space-y-2' : 'flex'}>
            <div class="form-control flex w-full justify-between">
                <label class="label flex w-full cursor-pointer justify-between py-0">
                    <span class="label-text text-xs">Show Only Published</span>
                    <input type="checkbox" bind:checked={isPublished} class="checkbox no-animation checkbox-xs ms-2" />
                </label>
            </div>
            {#if shouldShowNotApplicable}
                <div class="form-control flex w-full justify-between">
                    <label class="label flex w-full cursor-pointer justify-between py-0">
                        <span class="label-text text-xs">Show Only N/A</span>
                        <input
                            type="checkbox"
                            bind:checked={isNotApplicable}
                            class="checkbox no-animation checkbox-xs ms-2"
                        />
                    </label>
                </div>
            {/if}
        </div>
        <input
            bind:value={searchInputValue}
            use:enterKeyHandler={applyFilters}
            class="input input-bordered input-md min-w-[8rem] grow"
            placeholder={$translate('page.resources.searchBox.value')}
        />
        <button class="btn btn-primary" disabled={!canApplyFilters} onclick={applyFilters}>Apply</button>
    </div>

    {#await resourceContentDataPromise}
        <CenteredSpinner />
    {:then resourceContentsOrNull}
        <div
            class="mx-4 flex-1 overflow-auto rounded-md border
                {resourceContentsOrNull?.resourceContents.length ? 'rounded-b-none' : 'mb-4'}"
        >
            <table class="table-pin-rows table">
                <thead>
                    <tr class="bg-base-200">
                        <th class="w-[30%]">{$translate('page.resources.table.nameHeader.value')}</th>
                        <th class="w-[20%]">{$translate('page.resources.table.typeHeader.value')}</th>
                        <th class="w-[5%]"></th>
                        <th class="w-[15%]">{$translate('page.resources.table.languageHeader.value')}</th>
                        <th class="w-[20%]">{$translate('page.resources.table.statusHeader.value')}</th>
                        <th class="w-[10%]">{$translate('page.resources.table.publishedHeader.value')}</th>
                    </tr>
                </thead>
                <tbody>
                    {#if resourceContentsOrNull}
                        {#each resourceContentsOrNull.resourceContents as resource (resource.id)}
                            {@const href = `/resources/${resource.id}`}
                            <tr class="hover">
                                <LinkedTableCell {href}>{resource.englishLabel}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.parentResourceName}</LinkedTableCell>
                                <LinkedTableCell {href}>
                                    {#if resource.hasAudio}
                                        <Icon data={volumeUp} class="h-4 w-4" />
                                    {/if}
                                </LinkedTableCell>
                                <LinkedTableCell {href}>{resource.languageEnglishDisplay}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.status}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.isPublished ? 'Yes' : 'No'}</LinkedTableCell>
                            </tr>
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
            <div class="bg-base-200 mx-4 mb-2 grid grid-cols-3 rounded-md rounded-t-none border border-t-0 p-2">
                <button
                    class="btn btn-outline self-center justify-self-start"
                    class:btn-disabled={$searchParams.page === 1}
                    onclick={() => ($searchParams.page -= 1)}
                    >{$translate('page.resources.table.navigation.previous.value')}</button
                >
                <div class="grid place-self-center">
                    <div class="mx-auto mb-2 flex">
                        {$translate('page.resources.table.navigation.pageNumber.value', {
                            values: {
                                currentPage: $searchParams.page,
                                totalPages: calculateTotalPages(resourceContentsOrNull.total),
                            },
                        })}
                    </div>
                    <select
                        bind:value={$resourcesPerPage}
                        onchange={() => invalidateAll()}
                        class="select select-bordered select-xs"
                    >
                        {#each [10, 50, 100] as count, i (i)}
                            <option value={count} selected={i === 0}>
                                {`${count} ${$translate('page.resources.table.navigation.perPage.value')}`}
                            </option>
                        {/each}
                    </select>
                </div>
                <button
                    class="btn btn-outline self-center justify-self-end"
                    class:btn-disabled={$searchParams.page === calculateTotalPages(resourceContentsOrNull.total)}
                    onclick={() => ($searchParams.page += 1)}
                    >{$translate('page.resources.table.navigation.next.value')}</button
                >
            </div>
        {/if}
    {:catch error}
        <ErrorMessage uncastError={error} />
    {/await}
</div>

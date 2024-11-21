<script lang="ts">
    import type { PageData } from './$types';
    import type { TranslationPair } from '$lib/types/base';
    import type { column } from '$lib/types/table';
    import { patchToApi, postToApi, deleteToApi } from '$lib/utils/http-service';
    import { debounce } from '$lib/utils/debounce';
    import { createSettingsTableSorter, SortName } from './settings-table-sorter';
    import { log } from '$lib/logger';
    import { isApiErrorWithMessage } from '$lib/utils/http-errors';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import Table from '$lib/components/Table.svelte';
    import Select from '$lib/components/Select.svelte';
    import TrashIcon from '$lib/icons/TrashIcon.svelte';
    import Modal from '$lib/components/Modal.svelte';

    interface TranslationPairsLanguage {
        languageId: number;
        englishDisplay: string;
    }

    interface NewTranslationPairResponse {
        id: number;
    }

    export let data: PageData;

    let isTransacting = false;
    let search = '';
    let translationPairs: TranslationPair[] = [];
    let filteredTranslationPairs: TranslationPair[] = [];
    let translationPairsLanguages: TranslationPairsLanguage[] = [];
    let openDeleteModal = false;
    let openCreateModal = false;
    let newKey = '';
    let newValue = '';
    let currentLanguageDisplayname = '';
    let currentDeleteTranslationPairId = 0;
    let errorMessage = '';
    let openErrorModal = false;
    let table: Table<TranslationPair> | undefined;

    $: filteredTranslationPairs = filterTranslationPairs(search, translationPairs, $searchParams.currentLanguageId);
    $: currentLanguageDisplayname = getCurrentLanguageDisplayname($searchParams.currentLanguageId);
    $: settingsColumns = buildSettingsColumns(currentLanguageDisplayname);
    $: translationPairs = data.translationPairs;
    $: getTranslationPairsLanguages(translationPairs);

    const sortSettingsData = createSettingsTableSorter<TranslationPair>();

    const buildSettingsColumns = (currentLanguageDisplayname: string) => {
        const settingsColumns: column<TranslationPair>[] = [
            { text: 'English', itemKey: 'translationPairKey', sortKey: SortName.English },
            { text: currentLanguageDisplayname, itemKey: 'translationPairValue', sortKey: SortName.TargetLanguage },
            { text: '', itemKey: undefined, sortKey: undefined },
        ];

        return settingsColumns;
    };

    const searchParams = searchParameters(
        {
            sort: ssp.string(SortName.English),
            currentLanguageId: ssp.number(0),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    const getTranslationPairsLanguages = (translationPairs: TranslationPair[]) => {
        translationPairsLanguages = Array.from(
            new Set(translationPairs.map((translationPair) => translationPair.languageId))
        ).map((tpl) => ({
            languageId: tpl,
            englishDisplay: data.languages.find((l) => l.id === tpl)?.englishDisplay ?? '',
        }));

        if ($searchParams.currentLanguageId === 0) {
            $searchParams.currentLanguageId = translationPairsLanguages[0]?.languageId ?? 0;
        }
    };

    const openDeleteTranslationPair = (translationPairId: number) => () => {
        currentDeleteTranslationPairId = translationPairId;
        openDeleteModal = true;
    };

    const deleteTranslationPair = async () => {
        try {
            await deleteToApi(`/translation-pairs/${currentDeleteTranslationPairId}`);
            translationPairs = translationPairs.filter((tp) => tp.translationPairId !== currentDeleteTranslationPairId);
        } catch (e) {
            errorMessage = 'An error occurred while deleting the translation pair.';
            openErrorModal = true;
            currentDeleteTranslationPairId = 0;
            isTransacting = false;
            log.exception(e);
        } finally {
            currentDeleteTranslationPairId = 0;
            isTransacting = false;
        }
    };

    const addTranslationPair = async () => {
        isTransacting = true;
        openCreateModal = false;

        try {
            const response = await postToApi<NewTranslationPairResponse>(`/translation-pairs`, {
                languageId: $searchParams.currentLanguageId,
                key: newKey,
                value: newValue,
            });
            if (response) {
                translationPairs = [
                    ...translationPairs,
                    {
                        translationPairId: response.id,
                        languageId: $searchParams.currentLanguageId,
                        translationPairKey: newKey,
                        translationPairValue: newValue,
                        languageEnglishDisplay: currentLanguageDisplayname,
                    },
                ];
                translationPairs = translationPairs.sort((a, b) =>
                    a.translationPairKey.localeCompare(b.translationPairKey)
                );
            }
        } catch (e) {
            errorMessage = 'An error occurred while adding the translation pair.';
            let containsErrorMessage = isApiErrorWithMessage(e, 'Key already exists for this language');

            if (containsErrorMessage) {
                errorMessage = 'Key already exists for this language.';
            }
            openErrorModal = true;
            newKey = '';
            newValue = '';
            isTransacting = false;

            if (!containsErrorMessage) {
                log.exception(e);
            }
        } finally {
            newKey = '';
            newValue = '';
            isTransacting = false;
        }
    };

    const patchTranslationPairKey = async (event: Event, id: number) => {
        try {
            const target = event.target as HTMLInputElement;
            const key = target.value;

            isTransacting = true;
            await patchToApi(`/translation-pairs/${id}`, { key });
        } catch (e) {
            errorMessage = 'An error occurred while updating the translation pair.';
            openErrorModal = true;
            isTransacting = false;
            log.exception(e);
        } finally {
            isTransacting = false;
        }
    };

    const patchTranslationPairValue = async (event: Event, id: number) => {
        try {
            const target = event.target as HTMLInputElement;
            const value = target.value;

            isTransacting = true;
            await patchToApi(`/translation-pairs/${id}`, { value });
        } catch (e) {
            errorMessage = 'An error occurred while updating the translation pair.';
            openErrorModal = true;
            isTransacting = false;
            log.exception(e);
        } finally {
            isTransacting = false;
        }
    };

    const filterTranslationPairs = (search: string, translationPairs: TranslationPair[], currentLanguageId: number) => {
        return translationPairs.filter(
            (tp) =>
                tp.translationPairKey.toLowerCase().includes(search.toLowerCase()) &&
                tp.languageId === currentLanguageId
        );
    };

    const getCurrentLanguageDisplayname = (currentLanguageId: number) => {
        return translationPairsLanguages.find((tpl) => tpl.languageId === currentLanguageId)?.englishDisplay ?? '';
    };
</script>

<div class="flex h-full flex-col overflow-x-hidden overflow-y-hidden px-4">
    <div class="mb-6 mt-4 flex">
        <h1 class="my-auto text-3xl">Settings</h1>
    </div>

    <div class="flex w-1/2 flex-col overflow-y-hidden">
        <h1 class="my-auto mb-6 text-2xl">
            Translation Pairs {translationPairsLanguages.length === 1 ? ` - ${currentLanguageDisplayname}` : ''}
        </h1>
        <div class="mb-4 flex">
            <input
                type="text"
                class="input input-bordered me-4 max-w-xs focus:outline-none"
                bind:value={search}
                placeholder="Search"
            />
            {#if translationPairsLanguages.length > 1}
                <Select
                    class="select select-bordered max-w-[14rem] flex-grow"
                    bind:value={$searchParams.currentLanguageId}
                    isNumber={true}
                    options={[
                        ...translationPairsLanguages.map((tpl) => ({
                            value: tpl.languageId,
                            label: tpl.englishDisplay,
                        })),
                    ]}
                />
            {/if}
            <button
                class="btn btn-primary ms-4"
                on:click={() => {
                    openCreateModal = true;
                }}
            >
                Add
            </button>
            {#if isTransacting}
                <div class="flex grow justify-end"><div class="loading loading-spinner" /></div>
            {/if}
        </div>
        <Table
            bind:this={table}
            columns={settingsColumns}
            enableSelectAll={false}
            idColumn="translationPairId"
            noItemsText="No Translation Pairs Found"
            items={sortSettingsData(filteredTranslationPairs, $searchParams.sort)}
            searchable={true}
            bind:searchText={search}
            bind:searchParams={$searchParams}
        >
            <tbody slot="customTbody" let:rowItems>
                {#each rowItems as translationPair (translationPair.translationPairId)}
                    {@const debouncePatchPerKey = debounce(patchTranslationPairKey, 1500)}
                    {@const debouncePatchPerValue = debounce(patchTranslationPairValue, 1500)}

                    <tr>
                        <td>
                            <input
                                type="text"
                                value={translationPair.translationPairKey}
                                class="h-full grow p-2"
                                on:keyup={(event) => debouncePatchPerKey(event, translationPair.translationPairId)}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={translationPair.translationPairValue}
                                class="h-full grow p-2"
                                on:keyup={(event) => debouncePatchPerValue(event, translationPair.translationPairId)}
                            />
                        </td>
                        <td
                            on:click={openDeleteTranslationPair(translationPair.translationPairId)}
                            class="cursor-pointer"
                        >
                            <TrashIcon />
                        </td>
                    </tr>
                {/each}
            </tbody>
        </Table>
    </div>
</div>
<Modal
    bind:open={openCreateModal}
    header={'Add Translation Pair'}
    {isTransacting}
    primaryButtonDisabled={!newKey || !newValue}
    primaryButtonOnClick={() => addTranslationPair()}
    primaryButtonText="Add"
>
    <div class="flex flex-col">
        <div class="mb-2 text-lg">English</div>
        <input type="text" class="input input-bordered mb-4" placeholder="Key" bind:value={newKey} />
        <div class="mb-2 text-lg">
            {currentLanguageDisplayname}
        </div>
        <input type="text" class="input input-bordered mb-4" placeholder="Value" bind:value={newValue} />
    </div>
</Modal>
<Modal
    bind:open={openDeleteModal}
    header={'Delete Translation Pair'}
    {isTransacting}
    primaryButtonOnClick={() => deleteTranslationPair()}
    primaryButtonText="Delete"
>
    <div class="flex flex-col">
        <div class="mb-4 text-lg">Are you sure you want to delete this translation pair?</div>
        <div class="flex w-full grow">
            <div class="me-16 font-bold">
                {translationPairs.find((tp) => tp.translationPairId === currentDeleteTranslationPairId)
                    ?.translationPairKey}
            </div>
            <div class="font-bold">
                {translationPairs.find((tp) => tp.translationPairId === currentDeleteTranslationPairId)
                    ?.translationPairValue}
            </div>
        </div>
    </div>
</Modal>
<Modal bind:open={openErrorModal} header={'Error'} isError={true} description={errorMessage}></Modal>

<script lang="ts">
    import { getMarkAttributes, type Editor } from '@tiptap/core';
    import Modal from '../Modal.svelte';
    import Tooltip from '../Tooltip.svelte';
    import { getIsPageTransactingContext } from '$lib/context/is-page-transacting-context';
    import ResourceIcon from '$lib/icons/ResourceIcon.svelte';
    import Select from '../Select.svelte';
    import CenteredSpinner from '../CenteredSpinner.svelte';
    import { deleteToApi, getFromApi, postToApi } from '$lib/utils/http-service';
    import { parseResourceReferences } from '../tiptap/resourceReferenceMark';
    import { parentResources } from '$lib/stores/parent-resources';
    import MagnifyingGlassIcon from '$lib/icons/MagnifyingGlassIcon.svelte';
    import XSquareIcon from '$lib/icons/XSquareIcon.svelte';

    const isPageTransacting = getIsPageTransactingContext();

    $: {
        if (!isModalOpen) {
            parentResourceId = 0;
            referenceResource = null;
            resourceSearchResults = null;
            existingReference = false;
            isTransactingAdd = false;
            isTransactingRemove = false;
            searchQuery = '';
            isError = false;
        }
    }

    export let resourceContentId: number;
    export let editor: Editor;

    interface ResourceReference {
        resourceId: number;
        englishLabel: number;
    }

    let isTransactingAdd = false;
    let isTransactingRemove = false;
    let isModalOpen = false;
    let isLoading = false;
    let existingReference = false;
    let parentResourceId = 0;
    let referenceResource: ResourceReference | null = null;
    let searchQuery = '';
    let resourceSearchResults: ResourceReference[] | null = null;
    let isError = false;

    $: disabled =
        $isPageTransacting ||
        getMarkAttributes(editor.state, 'bibleReference')?.verses ||
        (editor.state.selection.empty && !getMarkAttributes(editor.state, 'resourceReference')?.resourceId);

    async function removeLink() {
        isTransactingRemove = true;
        isError = false;
        try {
            await deleteIfOnlyOneReference();

            const { from, to } = editor.state.selection;
            editor
                .chain()
                .focus()
                .extendMarkRange('resourceReference')
                .unsetMark('resourceReference')
                .setTextSelection({ from, to })
                .run();

            isModalOpen = false;
        } catch (e) {
            isError = true;
            throw e;
        } finally {
            isTransactingRemove = false;
        }
    }

    async function addLink() {
        isTransactingAdd = true;
        isError = false;
        try {
            const prType = $parentResources.find((p) => p.id === parentResourceId)?.code;
            if (prType && referenceResource?.resourceId) {
                await postToApi('/resources/resource-references', {
                    resourceContentId,
                    referenceResourceId: referenceResource.resourceId,
                });

                editor
                    .chain()
                    .focus()
                    .setMark('resourceReference', {
                        resourceId: referenceResource.resourceId.toString(),
                        resourceType: prType,
                    })
                    .run();
            }
        } catch (e) {
            isError = true;
            throw e;
        } finally {
            isTransactingAdd = false;
        }
    }

    async function deleteIfOnlyOneReference() {
        const references = parseResourceReferences(editor.state.toJSON());
        const prCode = parentResourceIdToCode(parentResourceId);
        if (
            referenceResource?.resourceId &&
            references.filter(
                ({ resourceId, resourceType }) =>
                    resourceId.toString() === referenceResource?.resourceId.toString() && resourceType === prCode
            ).length === 1
        ) {
            await deleteToApi('/resources/resource-references', {
                resourceContentId,
                referenceResourceId: referenceResource.resourceId,
            });
        }
    }

    async function openModal() {
        const mark = editor.getAttributes('resourceReference');
        const prId = parentResourceCodeToId(mark.resourceType);
        if (mark.resourceId && !!prId) {
            existingReference = true;
            parentResourceId = prId;
            isLoading = true;
            isError = false;
            isModalOpen = true;
            try {
                referenceResource = await getFromApi<ResourceReference>(
                    `/resources/resource-references?parentResourceId=${parentResourceId}&resourceId=${parseInt(
                        mark.resourceId.toString()
                    )}`
                );
            } catch (e) {
                isError = true;
                throw e;
            } finally {
                isLoading = false;
            }
        } else {
            existingReference = false;
            isError = false;
            isModalOpen = true;
        }
    }

    function updateSearchQuery(event: Event) {
        const target = event.target as HTMLInputElement;
        searchQuery = target.value;
    }

    function searchIfEnter(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            search();
        }
    }

    async function search() {
        if (searchQuery.length > 2) {
            isLoading = true;
            isError = false;
            try {
                resourceSearchResults = await getFromApi<ResourceReference[]>(
                    `/resources/resource-references/search?parentResourceId=${parentResourceId}&query=${searchQuery}`
                );
            } catch (e) {
                isError = true;
                throw e;
            } finally {
                isLoading = false;
            }
        }
    }

    function selectSearchResult(selectedResult: ResourceReference) {
        referenceResource = selectedResult;
        searchQuery = '';
        resourceSearchResults = null;
    }

    function clearResource() {
        referenceResource = null;
        searchQuery = '';
        resourceSearchResults = null;
    }

    function parentResourceCodeToId(code: string) {
        return $parentResources.find((p) => p.code === code)?.id;
    }

    function parentResourceIdToCode(id: number) {
        return $parentResources.find((p) => p.id === id)?.code;
    }
</script>

<Tooltip
    position={{ left: '2rem', bottom: '0.2rem' }}
    class="flex border-primary align-middle text-primary"
    text="Associate Resource Item"
>
    <button
        data-app-insights-event-name="editor-toolbar-resource-reference-click"
        class="btn btn-xs px-1 {disabled && '!bg-base-200'} btn-link hover:bg-[#e6f7fc]"
        {disabled}
        on:click={openModal}
    >
        <div class="mt-[-1px] scale-[85%]">
            <ResourceIcon />
        </div>
    </button>
</Tooltip>

<Modal
    primaryButtonText={existingReference ? null : 'Add Link'}
    primaryButtonOnClick={addLink}
    primaryButtonDisabled={!referenceResource || isTransactingRemove}
    isTransacting={isTransactingAdd}
    bind:open={isModalOpen}
    header="Associate Resource Item"
>
    {#if isError}
        <span class="text-xs text-error">Error occurred, try again</span>
    {/if}
    {#if isLoading && existingReference}
        <CenteredSpinner />
    {:else}
        <div class="mb-2 flex flex-col gap-2">
            <Select
                class="select  select-bordered w-full"
                isNumber={true}
                options={[
                    { value: 0, label: 'Resource' },
                    ...($parentResources || []).map((pr) => ({ value: pr.id, label: pr.displayName })),
                ]}
                bind:value={parentResourceId}
                disabled={existingReference}
                onChange={() => {
                    referenceResource = null;
                    searchQuery = '';
                }}
            />
            <label
                class="label {!parentResourceId && 'input-disabled'} input input-bordered flex items-center gap-2 pe-1"
            >
                <input
                    value={referenceResource?.englishLabel ?? searchQuery}
                    on:input={updateSearchQuery}
                    on:keydown={searchIfEnter}
                    class="grow"
                    type="text"
                    disabled={!parentResourceId}
                    readonly={existingReference}
                />
                {#if !existingReference && parentResourceId}
                    {#if referenceResource}
                        <button on:click={clearResource} class="btn btn-link btn-sm">
                            <XSquareIcon />
                        </button>
                    {:else}
                        <button on:click={search} class="btn btn-link btn-sm">
                            <MagnifyingGlassIcon />
                        </button>
                    {/if}
                {/if}
            </label>
            {#if isLoading}
                <div class="mt-4">
                    <CenteredSpinner />
                </div>
            {:else if resourceSearchResults}
                <ul class="max-h-56 w-full space-y-4 overflow-y-scroll rounded-md border px-4 py-3">
                    {#each resourceSearchResults as searchResult (searchResult.resourceId)}
                        <li>
                            <button on:click={() => selectSearchResult(searchResult)}
                                >{searchResult.englishLabel}</button
                            >
                        </li>
                    {:else}
                        <div>No results found.</div>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
    <svelte:fragment slot="additional-buttons">
        {#if existingReference && !isLoading}
            <div class="grow" />
            <button disabled={isTransactingRemove} class="btn btn-error" on:click={removeLink}>
                {#if isTransactingRemove}
                    <span class="loading loading-spinner" />
                {:else}
                    Remove Link
                {/if}
            </button>
        {/if}
    </svelte:fragment>
</Modal>

<script lang="ts">
    import { getMarkAttributes, type Editor } from 'aquifer-tiptap';
    import Modal from '../Modal.svelte';
    import Tooltip from '../Tooltip.svelte';
    import { getIsPageTransactingContext } from '$lib/context/is-page-transacting-context';
    import ResourceIcon from '$lib/icons/ResourceIcon.svelte';
    import Select from '../Select.svelte';
    import CenteredSpinner from '../CenteredSpinner.svelte';
    import { deleteToApi, getFromApi, postToApi } from '$lib/utils/http-service';
    import { parseResourceReferences } from '../tiptap/extensions/resource-reference';
    import MagnifyingGlassIcon from '$lib/icons/MagnifyingGlassIcon.svelte';
    import XSquareIcon from '$lib/icons/XSquareIcon.svelte';
    import { BibleReference, ResourceReference } from 'aquifer-tiptap';
    import { getContext } from 'svelte';
    import type { ParentResource } from '$lib/types/base';

    const isPageTransacting = getIsPageTransactingContext();
    const parentResources = getContext<() => ParentResource[]>('parentResources');

    $: {
        if (!isModalOpen) {
            parentResourceId = 0;
            referenceResource = null;
            resourceSearchResults = null;
            existingReference = false;
            isTransactingAdd = false;
            isTransactingRemove = false;
            searchQuery = '';
            errorMessage = null;
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
    let errorMessage: string | null = null;

    $: disabled =
        $isPageTransacting ||
        getMarkAttributes(editor.state, BibleReference.name)?.verses ||
        (editor.state.selection.empty && !getMarkAttributes(editor.state, ResourceReference.name)?.resourceId);

    async function removeLink() {
        isTransactingRemove = true;
        errorMessage = null;
        try {
            await deleteIfOnlyOneReference();

            const { from, to } = editor.state.selection;
            editor
                .chain()
                .focus()
                .extendMarkRange(ResourceReference.name)
                .unsetMark(ResourceReference.name)
                .setTextSelection({ from, to })
                .run();

            isModalOpen = false;
        } catch (e) {
            errorMessage = 'Error occurred, try again';
            throw e;
        } finally {
            isTransactingRemove = false;
        }
    }

    async function addLink() {
        isTransactingAdd = true;
        errorMessage = null;
        try {
            const prType = parentResources().find((p) => p.id === parentResourceId)?.code;
            if (prType && referenceResource?.resourceId) {
                await postToApi('/resources/resource-references', {
                    resourceContentId,
                    referenceResourceId: referenceResource.resourceId,
                });

                editor
                    .chain()
                    .focus()
                    .setMark(ResourceReference.name, {
                        resourceId: referenceResource.resourceId.toString(),
                        resourceType: prType,
                    })
                    .run();
            }
        } catch (e) {
            errorMessage = 'Error occurred, try again';
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
        const mark = editor.getAttributes(ResourceReference.name);
        const prId = parentResourceCodeToId(mark.resourceType);
        if (mark.resourceId && !!prId) {
            existingReference = true;
            parentResourceId = prId;
            isLoading = true;
            errorMessage = null;
            isModalOpen = true;
            const resourceIdNumber = parseInt(mark.resourceId.toString());
            if (resourceIdNumber) {
                try {
                    referenceResource = await getFromApi<ResourceReference>(
                        `/resources/resource-references?parentResourceId=${parentResourceId}&resourceId=${resourceIdNumber}`
                    );
                } catch (e) {
                    errorMessage = 'Error occurred, try again';
                    throw e;
                } finally {
                    isLoading = false;
                }
            } else {
                errorMessage = 'Unable to load resource details. Invalid resource link.';
                isLoading = false;
            }
        } else {
            existingReference = false;
            errorMessage = null;
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
            errorMessage = null;
            try {
                resourceSearchResults = await getFromApi<ResourceReference[]>(
                    `/resources/resource-references/search?parentResourceId=${parentResourceId}&query=${searchQuery}`
                );
            } catch (e) {
                errorMessage = 'Error searching, try again';
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
        return parentResources().find((p) => p.code === code)?.id;
    }

    function parentResourceIdToCode(id: number) {
        return parentResources().find((p) => p.id === id)?.code;
    }
</script>

<Tooltip
    position={{ left: '2rem', bottom: '0.2rem' }}
    class="border-primary text-primary flex align-middle"
    text="Associate Resource Item"
>
    <button
        data-app-insights-event-name="editor-toolbar-resource-reference-click"
        class="btn btn-xs px-1 {disabled && 'bg-base-200!'} btn-link hover:bg-[#e6f7fc]"
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
    {#if errorMessage}
        <span class="text-error w-full pb-2 text-center text-xs">{errorMessage}</span>
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
                    ...(parentResources() || []).map((pr) => ({ value: pr.id, label: pr.displayName })),
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
                <ul class="max-h-56 w-full space-y-4 overflow-y-auto rounded-md border px-4 py-3">
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
    {#snippet additionalButtons()}
        {#if existingReference && !isLoading}
            <div class="grow"></div>
            <button disabled={isTransactingRemove} class="btn btn-error" on:click={removeLink}>
                {#if isTransactingRemove}
                    <span class="loading loading-spinner"></span>
                {:else}
                    Remove Link
                {/if}
            </button>
        {/if}
    {/snippet}
</Modal>

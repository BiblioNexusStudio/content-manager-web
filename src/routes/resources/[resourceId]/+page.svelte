<script lang="ts">
    import type { PageData } from './$types';
    import LanguageDropdown from '$lib/components/resources/LanguageDropdown.svelte';
    import Overview from '$lib/components/resources/Overview.svelte';
    import Details from '$lib/components/resources/Details.svelte';
    import RelatedContent from '$lib/components/resources/RelatedContent.svelte';
    import BibleReferences from '$lib/components/resources/BibleReferences.svelte';
    import Content from '$lib/components/resources/Content.svelte';
    import { type Resource, ResourceStatusEnum } from '$lib/types/resources';
    import { convertToReadableSize } from '$lib/utils/conversions';
    import { languageId, filteredResourcesByLanguage } from '$lib/stores/resources';
    import { originalValues, updatedValues, resetUpdated, updateOriginal } from '$lib/stores/tiptapContent';
    import { beforeNavigate, goto } from '$app/navigation';
    import { canEdit } from '$lib/stores/auth';
    import { fetchFromApi, unwrapStreamedDataWithCallback } from '$lib/utils/http-service';
    import { auth0Client } from '$lib/stores/auth';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';

    beforeNavigate((x) => {
        if (contentUpdated) {
            onCloseModal.showModal();
            x.cancel();
        }
    });

    let onCloseModal: HTMLDialogElement;
    let loadingModal: HTMLDialogElement;
    let errorModal: HTMLDialogElement;

    export let data: PageData;

    $: resourcePromise = unwrapStreamedDataWithCallback(data.streamedResource, (resource) => {
        $filteredResourcesByLanguage = resource.resources.filter((resource) => resource.language.id === $languageId);
    });

    $: contentUpdated = JSON.stringify($originalValues) !== JSON.stringify($updatedValues);

    function availableLanguages(resource: Resource) {
        return resource.resources
            .map((resource) => resource.language)
            .filter((currentObject, currentIndex, array) => {
                let firstIndex = array.findIndex((otherObject) => {
                    return otherObject.id === currentObject.id && otherObject.displayName === currentObject.displayName;
                });

                return currentIndex === firstIndex;
            });
    }

    $: resourceSize = convertToReadableSize(
        $filteredResourcesByLanguage.reduce((acc, resource) => acc + resource.contentSize, 0)
    );

    $: resourceStatus = $filteredResourcesByLanguage.every(
        (resource) => resource.status === ResourceStatusEnum.completed || resource.status === ResourceStatusEnum.none
    )
        ? ResourceStatusEnum.completed
        : $filteredResourcesByLanguage.some((resource) => resource.status === ResourceStatusEnum.inProgress)
        ? ResourceStatusEnum.inProgress
        : ResourceStatusEnum.notStarted;

    $: hasAudio = $filteredResourcesByLanguage.some((resource) => resource.mediaType.toLowerCase() === 'audio');

    let isSaving = false;
    const onSave = async () => {
        isSaving = true;
        await putData();
        isSaving = false;
    };

    const onSaveAndCloseClick = async () => {
        loadingModal.showModal();
        const response = await putData();

        if (response.status === 204) {
            goBack();
        } else {
            loadingModal.close();
        }
    };

    const goBack = () => {
        window.history.length > 1 ? window.history.back() : goto('/resources');
    };

    const putData = async () => {
        const token = await $auth0Client?.getTokenSilently();
        const response = await fetchFromApi(`/resources/summary/${$updatedValues.contentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                status: $updatedValues.status,
                label: $updatedValues.label,
                content: $updatedValues.content,
            }),
        });

        if (response.status === 204) {
            updateOriginal();
        } else {
            errorModal.showModal();
        }

        return response;
    };
</script>

{#await resourcePromise}
    <CenteredSpinner />
{:then resource}
    <div class="p-8">
        <div class="mb-8 flex items-center justify-between">
            <h1 class="me-8 text-2xl font-bold">{resource.parentResourceName} - {$originalValues.label}</h1>

            <div class="flex">
                <LanguageDropdown languageSet={availableLanguages(resource)} disable={contentUpdated} />
                {#if $canEdit}<button
                        class="btn btn-primary ms-4 w-[72px]"
                        class:btn-disabled={!contentUpdated || isSaving}
                        on:click={onSave}
                        >{#if isSaving}
                            <span class="loading loading-spinner" />
                        {:else}
                            Save
                        {/if}
                    </button>
                {/if}
                <button class="btn btn-primary btn-outline ms-4" on:click={goBack}>Close</button>
            </div>
        </div>
        <div class="flex">
            <div class="me-8 flex w-4/12 flex-col">
                <Overview labelText={resource.label} typeText={resource.parentResourceName} />
                <Details translationStatus={resourceStatus} sizeText={resourceSize} {hasAudio} />
                <RelatedContent relatedContent={resource.associatedResources} />
                <BibleReferences bibleReferences={resource.passageReferences} />
            </div>
            <div class="flex w-8/12 flex-col">
                <Content typeText={resource.parentResourceName} />
            </div>
        </div>
    </div>
{:catch}
    <div class="p-8">Resource not found</div>
{/await}

<dialog bind:this={onCloseModal} class="modal">
    <div class="modal-box">
        <h3 class="text-xl font-bold">Unsaved Changes</h3>
        <p class="py-4 text-lg">There are unsaved changes. Do you want to save them?</p>
        <div class="modal-action pt-4">
            <form method="dialog">
                <button class="btn btn-primary" on:click={onSaveAndCloseClick}>Save and Close</button>
                <button
                    class="btn btn-error"
                    on:click={() => {
                        resetUpdated();
                        goBack();
                    }}>Discard Changes</button
                >
                <button class="btn btn-primary btn-outline">Cancel</button>
            </form>
        </div>
    </div>
</dialog>
<dialog bind:this={loadingModal} class="modal">
    <span class="loading loading-spinner w-24 text-primary"></span>
</dialog>
<dialog bind:this={errorModal} class="modal">
    <div class="modal-box bg-error">
        <form method="dialog">
            <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">✕</button>
        </form>
        <h3 class="text-xl font-bold">Error</h3>
        <p class="py-4 text-lg font-medium">An error occurred while saving. Please try again.</p>
    </div>
</dialog>

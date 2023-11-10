<script lang="ts">
    import LanguageDropdown from '$lib/components/resources/LanguageDropdown.svelte';
    import Overview from '$lib/components/resources/Overview.svelte';
    import Details from '$lib/components/resources/Details.svelte';
    import RelatedContent from '$lib/components/resources/RelatedContent.svelte';
    import BibleReferences from '$lib/components/resources/BibleReferences.svelte';
    import Content from '$lib/components/resources/Content.svelte';
    import { type Resource, type ResourceResponse, ResourceStatusEnum } from '$lib/types/resources';
    import { convertToReadableSize } from '$lib/utils/conversions';
    import { languageId, filteredResourcesByLanguage } from '$lib/stores/resources';
    import { originalValues, updatedValues, reset } from '$lib/stores/tiptapContent';
    import CheckCircleIcon from '$lib/icons/CheckCircleIcon.svelte';
    import { beforeNavigate } from '$app/navigation';

    beforeNavigate((x) => {
        if (contentUpdated) {
            let modal = document?.getElementById('onCloseModal') as HTMLDialogElement;
            modal?.showModal();
            x.cancel();
        }
    });

    export let data: ResourceResponse;

    $: contentUpdated = JSON.stringify($originalValues) !== JSON.stringify($updatedValues);

    const resource: Resource = data.resource;

    const availableLanguages = resource.resources
        .map((resource) => resource.language)
        .filter((currentObject, currentIndex, array) => {
            let firstIndex = array.findIndex((otherObject) => {
                return otherObject.id === currentObject.id && otherObject.displayName === currentObject.displayName;
            });

            return currentIndex === firstIndex;
        });

    $: $filteredResourcesByLanguage = resource.resources.filter((resource) => resource.language.id === $languageId);

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
    const onSaveAndCloseClick = () => {
        isSaving = true;
        let modal = document?.getElementById('loadingModal') as HTMLDialogElement;
        modal?.showModal();
        setTimeout(() => {
            isSaving = false;
        }, 1500);
    };
</script>

<div class="p-8">
    <div class="mb-8 flex items-center justify-between">
        <h1 class="mr-8 text-2xl font-bold">{resource.type} - {resource.label}</h1>

        <div class="flex">
            <LanguageDropdown languageSet={availableLanguages} />
            <button class="btn btn-primary mx-4" class:btn-disabled={!contentUpdated}>Save</button>
            <button class="btn btn-primary btn-outline" on:click={() => window.history.back()}>Close</button>
        </div>
    </div>
    <div class="flex">
        <div class="mr-8 flex w-4/12 flex-col">
            <Overview labelText={resource.label} typeText={resource.type} />
            <Details translationStatus={resourceStatus} sizeText={resourceSize} {hasAudio} />
            <RelatedContent relatedContent={resource.associatedResources} />
            <BibleReferences bibleRefernces={resource.passageReferences} />
        </div>
        <div class="flex w-8/12 flex-col">
            <Content typeText={resource.type} />
        </div>
    </div>
</div>
<dialog id="onCloseModal" class="modal">
    <div class="modal-box">
        <h3 class="text-xl font-bold">Unsaved Changes</h3>
        <p class="py-4 text-lg">There are unsaved changes. Do you want to save them?</p>
        <div class="modal-action pt-4">
            <form method="dialog">
                <button class="btn btn-primary" on:click={onSaveAndCloseClick}>Save and Close</button>
                <button
                    class="btn btn-error"
                    on:click={() => {
                        reset();
                        window.history.back();
                    }}>Discard Changes</button
                >
                <button class="btn btn-primary btn-outline">Cancel</button>
            </form>
        </div>
    </div>
</dialog>
<dialog id="loadingModal" class="modal">
    {#if isSaving}
        <span class="loading loading-ring w-24 text-success"></span>
    {:else}
        <span class="text-success">
            <CheckCircleIcon />
        </span>
    {/if}
</dialog>

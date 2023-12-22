<script lang="ts">
    import type { PageData } from './$types';
    import LanguageDropdown from '$lib/components/resources/LanguageDropdown.svelte';
    import Overview from '$lib/components/resources/Overview.svelte';
    import Process from '$lib/components/resources/Process.svelte';
    import RelatedContent from '$lib/components/resources/RelatedContent.svelte';
    import BibleReferences from '$lib/components/resources/BibleReferences.svelte';
    import Content from '$lib/components/resources/Content.svelte';
    import type { ResourceContent } from '$lib/types/resources';
    import { originalValues, updatedValues, resetUpdated, updateOriginal } from '$lib/stores/tiptapContent';
    import { beforeNavigate, goto } from '$app/navigation';
    import { fetchFromApiWithAuth, unwrapStreamedDataWithCallback } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { ResourceContentStatusEnum } from '$lib/types/base';
    import { getSortedReferences } from '$lib/utils/reference';
    import UserSelector from './UserSelector.svelte';
    import { Permission } from '$lib/stores/auth';

    beforeNavigate((x) => {
        if (contentUpdated) {
            onCloseModal.showModal();
            x.cancel();
        }
    });

    let onCloseModal: HTMLDialogElement;
    let loadingModal: HTMLDialogElement;
    let errorModal: HTMLDialogElement;
    let aquiferizeModal: HTMLDialogElement;
    let assignUserModal: HTMLDialogElement;
    let publishModal: HTMLDialogElement;
    let confirmSendReviewModal: HTMLDialogElement;

    let assignToUserId: string | null = null;
    let canMakeContentEdits = false;
    let canAquiferize = false;
    let canAssign = false;
    let canSendBack = false;
    let canPublish = false;
    let canUnpublish = false;
    let canSendReview = false;
    let canStartReview = false;
    let createDraft = false;

    export let data: PageData;

    $: resourceContentPromise = unwrapStreamedDataWithCallback(data.streamedResourceContent, handleFetchedResource);

    $: contentUpdated = JSON.stringify($originalValues) !== JSON.stringify($updatedValues);

    function availableLanguages(resourceContent: ResourceContent) {
        return resourceContent.otherLanguageContentIds
            .map((rc) => ({
                label: data.languages.find((language) => rc.languageId === language.id)?.englishDisplay,
                contentId: rc.contentId,
            }))
            .filter(Boolean);
    }

    function handleFetchedResource(resourceContent: ResourceContent) {
        const currentUserIsAssigned = resourceContent.assignedUser?.id === data.currentUser.id;

        canMakeContentEdits =
            data.currentUser.can(Permission.EditContent) &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview) &&
            currentUserIsAssigned;

        canAquiferize =
            data.currentUser.can(Permission.AquiferizeContent) &&
            (resourceContent.status === ResourceContentStatusEnum.New ||
                resourceContent.status === ResourceContentStatusEnum.Complete);

        canAssign =
            (data.currentUser.can(Permission.AssignOverride) ||
                (data.currentUser.can(Permission.AssignContent) && currentUserIsAssigned)) &&
            resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress;

        canSendBack =
            data.currentUser.can(Permission.AssignContent) &&
            currentUserIsAssigned &&
            resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview;

        canSendReview =
            data.currentUser.can(Permission.SendReviewContent) &&
            currentUserIsAssigned &&
            resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress;

        canStartReview =
            data.currentUser.can(Permission.ReviewContent) &&
            resourceContent.status === ResourceContentStatusEnum.AquiferizeReviewPending;

        canPublish =
            data.currentUser.can(Permission.PublishContent) &&
            ((resourceContent.status === ResourceContentStatusEnum.New && !resourceContent.isPublished) ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview);

        canUnpublish = data.currentUser.can(Permission.PublishContent) && resourceContent.isPublished;
    }

    let isTransacting = false;

    function openAquiferizeModal() {
        assignToUserId = null;
        aquiferizeModal.showModal();
    }

    function publishOrOpenModal(status: ResourceContentStatusEnum) {
        assignToUserId = null;
        createDraft = false;
        if (status === ResourceContentStatusEnum.New) {
            publishModal.showModal();
        } else {
            publish();
        }
    }

    function openAssignUserModal() {
        assignToUserId = null;
        assignUserModal.showModal();
    }

    async function takeActionAndRefresh(action: () => Promise<unknown>) {
        isTransacting = true;
        if (contentUpdated) {
            await putData();
        }
        try {
            await action();
            window.location.reload(); // do this for now. eventually we want to have the post return the new state of the resource so we don't need to refresh
        } catch (error) {
            errorModal.showModal();
            throw error;
        } finally {
            isTransacting = false;
        }
    }

    async function unpublish() {
        takeActionAndRefresh(() =>
            fetchFromApiWithAuth(`/admin/resources/content/${$updatedValues.contentId}/unpublish`, {
                method: 'POST',
            })
        );
    }

    async function sendReview() {
        takeActionAndRefresh(() =>
            fetchFromApiWithAuth(`/admin/resources/content/${$updatedValues.contentId}/send-review`, {
                method: 'POST',
            })
        );
    }

    async function startReview() {
        takeActionAndRefresh(() =>
            fetchFromApiWithAuth(`/admin/resources/content/${$updatedValues.contentId}/review`, {
                method: 'POST',
            })
        );
    }

    async function aquiferize() {
        takeActionAndRefresh(() =>
            fetchFromApiWithAuth(`/admin/resources/content/${$updatedValues.contentId}/aquiferize`, {
                method: 'POST',
                body: { assignedUserId: assignToUserId ? parseInt(assignToUserId) : null },
            })
        );
    }

    async function publish() {
        takeActionAndRefresh(() =>
            fetchFromApiWithAuth(`/admin/resources/content/${$updatedValues.contentId}/publish`, {
                method: 'POST',
                body: {
                    createDraft: createDraft,
                    assignedUserId: assignToUserId ? parseInt(assignToUserId) : null,
                },
            })
        );
    }

    async function assignUser() {
        takeActionAndRefresh(() =>
            fetchFromApiWithAuth(`/admin/resources/content/${$updatedValues.contentId}/assign-editor`, {
                method: 'POST',
                body: {
                    assignedUserId: assignToUserId ? parseInt(assignToUserId) : null,
                },
            })
        );
    }

    async function onSave() {
        isTransacting = true;
        try {
            await putData();
        } finally {
            isTransacting = false;
        }
    }

    async function onSaveAndCloseClick() {
        loadingModal.showModal();
        try {
            await putData();
            goBack();
        } catch {
            loadingModal.close();
        }
    }

    function goBack() {
        window.history.length > 1 ? window.history.back() : goto('/resources');
    }

    async function putData() {
        try {
            await fetchFromApiWithAuth(`/admin/resources/content/summary/${$updatedValues.contentId}`, {
                method: 'PUT',
                body: {
                    status: $updatedValues.status, // TODO: remove this once it gets removed from the API (don't want it manually editable)
                    displayName: $updatedValues.displayName,
                    content: $updatedValues.content,
                },
            });

            updateOriginal();
        } catch (error) {
            errorModal.showModal();
            throw error;
        }
    }
</script>

{#await resourceContentPromise}
    <CenteredSpinner />
{:then resourceContent}
    <div class="p-8">
        <div class="mb-8 flex items-center justify-between">
            <h1 class="me-8 text-2xl font-bold">
                {resourceContent.parentResourceName} -
                {$originalValues.displayName}
            </h1>

            <div class="flex">
                <LanguageDropdown languageSet={availableLanguages(resourceContent)} disable={contentUpdated} />
                {#if canAssign || canSendBack}
                    <button
                        class="btn btn-primary ms-4"
                        class:btn-disabled={isTransacting}
                        on:click={openAssignUserModal}
                        >{#if isTransacting}
                            <span class="loading loading-spinner" />
                        {:else}
                            {#if canAssign}
                                Assign User
                            {:else if canSendBack}
                                Send Back
                            {/if}
                        {/if}
                    </button>
                {/if}
                {#if canPublish}
                    <button
                        class="btn btn-primary ms-4"
                        class:btn-disabled={isTransacting}
                        on:click={() => publishOrOpenModal(resourceContent.status)}
                        >{#if isTransacting}
                            <span class="loading loading-spinner" />
                        {:else}
                            Publish
                        {/if}
                    </button>
                {/if}
                {#if canUnpublish}
                    <button class="btn btn-primary ms-4" class:btn-disabled={isTransacting} on:click={unpublish}
                        >{#if isTransacting}
                            <span class="loading loading-spinner" />
                        {:else}
                            Unpublish
                        {/if}
                    </button>
                {/if}
                {#if canSendReview}
                    <button
                        class="btn btn-primary ms-4"
                        class:btn-disabled={isTransacting}
                        on:click={() => confirmSendReviewModal.showModal()}
                        >{#if isTransacting}
                            <span class="loading loading-spinner" />
                        {:else}
                            Send to Review
                        {/if}
                    </button>
                {/if}
                {#if canStartReview}
                    <button class="btn btn-primary ms-4" class:btn-disabled={isTransacting} on:click={startReview}
                        >{#if isTransacting}
                            <span class="loading loading-spinner" />
                        {:else}
                            Review
                        {/if}
                    </button>
                {/if}
                {#if canAquiferize}
                    <button
                        class="btn btn-primary ms-4"
                        class:btn-disabled={isTransacting}
                        on:click={openAquiferizeModal}
                        >{#if isTransacting}
                            <span class="loading loading-spinner" />
                        {:else}
                            Aquiferize
                        {/if}
                    </button>
                {/if}
                {#if canMakeContentEdits}
                    <button
                        class="btn btn-primary ms-4 w-[72px]"
                        class:btn-disabled={!contentUpdated || isTransacting}
                        on:click={onSave}
                        >{#if isTransacting}
                            <span class="loading loading-spinner" />
                        {:else}
                            Save
                        {/if}
                    </button>
                {/if}
                <button class="btn btn-primary btn-outline ms-4" on:click={goBack}>Close</button>
            </div>
        </div>
        <div class="flex h-[85vh]">
            <div class="me-8 flex max-h-full w-4/12 flex-col">
                <Overview
                    canEdit={canMakeContentEdits}
                    displayNameText={resourceContent.displayName}
                    typeText={resourceContent.parentResourceName}
                    isPublished={resourceContent.isPublished}
                />
                <Process
                    translationStatus={resourceContent.status}
                    hasAudio={resourceContent.hasAudio}
                    assignedUser={resourceContent.assignedUser}
                    resourceContentStatuses={data.resourceContentStatuses}
                />
                <RelatedContent relatedContent={resourceContent.associatedResources} />
                <BibleReferences bibleReferences={getSortedReferences(resourceContent)} />
            </div>
            <div class="flex max-h-full w-8/12 flex-col">
                <Content canEdit={canMakeContentEdits} {resourceContent} mediaType={resourceContent.mediaType} />
            </div>
        </div>
    </div>

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

    <dialog bind:this={aquiferizeModal} class="modal">
        <div class="modal-box">
            <h3 class="w-full pb-4 text-center text-xl font-bold">Choose an Editor</h3>
            <div class="flex flex-col">
                <UserSelector users={data.users} defaultLabel="Select User" bind:selectedUserId={assignToUserId} />
                <div class="flex w-full flex-row space-x-2 pt-4">
                    <div class="flex-grow" />
                    <button class="btn btn-primary" on:click={aquiferize} disabled={assignToUserId === null}
                        >Assign</button
                    >
                    <button class="btn btn-primary btn-outline" on:click={() => aquiferizeModal.close()}>Cancel</button>
                </div>
            </div>
        </div>
    </dialog>

    <dialog bind:this={assignUserModal} class="modal">
        <div class="modal-box">
            <h3 class="w-full pb-4 text-center text-xl font-bold">Choose an Editor</h3>
            <div class="flex flex-col">
                <UserSelector
                    users={data.users}
                    defaultLabel="Select User"
                    bind:selectedUserId={assignToUserId}
                    hideUser={resourceContent.assignedUser}
                />
                <div class="flex w-full flex-row space-x-2 pt-4">
                    <div class="flex-grow" />
                    <button class="btn btn-primary" on:click={assignUser} disabled={assignToUserId === null}
                        >Assign</button
                    >
                    <button class="btn btn-primary btn-outline" on:click={() => assignUserModal.close()}>Cancel</button>
                </div>
            </div>
        </div>
    </dialog>

    <dialog bind:this={publishModal} class="modal">
        <div class="modal-box">
            <h3 class="w-full pb-4 text-center text-xl font-bold">Choose Publish Option</h3>
            <div class="flex flex-col">
                <div class="form-control">
                    <label class="label cursor-pointer justify-start space-x-2">
                        <input type="checkbox" bind:checked={createDraft} class="checkbox" />
                        <span class="label-text">Aquiferization Needed</span>
                    </label>
                </div>
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="form-control">
                    <div class="label">
                        <span class="label-text">Aquiferization Assignment (optional)</span>
                    </div>
                    <UserSelector
                        users={data.users}
                        defaultLabel="Unassigned"
                        disabled={!createDraft}
                        bind:selectedUserId={assignToUserId}
                    />
                </label>
                <div class="flex w-full flex-row space-x-2 pt-4">
                    <div class="flex-grow" />
                    <button class="btn btn-primary" on:click={publish}>Publish</button>
                    <button class="btn btn-primary btn-outline" on:click={() => publishModal.close()}>Cancel</button>
                </div>
            </div>
        </div>
    </dialog>

    <dialog bind:this={confirmSendReviewModal} class="modal">
        <div class="modal-box">
            <h3 class="text-xl font-bold">Confirm Send to Review</h3>
            <p class="py-4 text-lg">Have you completed your editing? Your assignment will be removed.</p>
            <div class="modal-action pt-4">
                <form method="dialog">
                    <button class="btn btn-primary" on:click={sendReview}>Send to Review</button>
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
{:catch}
    <div class="p-8">Resource not found</div>
{/await}

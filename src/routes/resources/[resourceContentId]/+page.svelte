<script lang="ts">
    import type { PageData } from './$types';
    import Overview from '$lib/components/resources/Overview.svelte';
    import Process from '$lib/components/resources/Process.svelte';
    import RelatedContent from '$lib/components/resources/RelatedContent.svelte';
    import BibleReferences from '$lib/components/resources/BibleReferences.svelte';
    import Content from '$lib/components/resources/Content.svelte';
    import { goto } from '$app/navigation';
    import type {
        ResourceContent,
        ResourceContentVersion,
        ContentItem,
        ContentTranslation,
    } from '$lib/types/resources';
    import { originalValues, updatedValues, updateOriginal, userStoppedEditing } from '$lib/stores/tiptapContent';
    import { fetchFromApiWithAuth, unwrapStreamedDataWithCallback } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { ResourceContentStatusEnum } from '$lib/types/base';
    import { getSortedReferences } from '$lib/utils/reference';
    import UserSelector from './UserSelector.svelte';
    import { Permission } from '$lib/stores/auth';
    import spinner from 'svelte-awesome/icons/spinner';
    import { Icon } from 'svelte-awesome';
    import Translations from '$lib/components/resources/Translations.svelte';
    import TranslationSelector from './TranslationSelector.svelte';

    let loadingModal: HTMLDialogElement;
    let errorModal: HTMLDialogElement;
    let aquiferizeModal: HTMLDialogElement;
    let assignUserModal: HTMLDialogElement;
    let publishModal: HTMLDialogElement;
    let addTranslationModal: HTMLDialogElement;
    let confirmSendReviewModal: HTMLDialogElement;

    let assignToUserId: string | null = null;
    let newTranslationLanguageId: string | null = null;
    let canMakeContentEdits = false;
    let canAquiferize = false;
    let canAssign = false;
    let canSendBack = false;
    let canPublish = false;
    let canUnpublish = false;
    let canSendReview = false;
    let canStartReview = false;
    let createDraft = false;
    let draftVersion: ResourceContentVersion | undefined = undefined;
    let publishedVersion: ResourceContentVersion | undefined = undefined;
    let hasPublished = false;
    let hasDraft = false;
    let selectedVersion: ResourceContentVersion;
    let englishContentTranslation: ContentTranslation | undefined;
    let createTranslationFromDraft = false;
    let isInTranslationWorkflow = false;
    let saveRetries = 0;
    let showAutoSaveFailedMessage = false;
    let putDataSuccess = false;
    let saveInterval: number | undefined;

    export let data: PageData;

    $: resourceContentPromise = unwrapStreamedDataWithCallback(data.streamedResourceContent, handleFetchedResource);
    $: contentUpdated = JSON.stringify($originalValues) !== JSON.stringify($updatedValues);
    $: contentUpdated && $userStoppedEditing ? onSave() : null;

    function handleFetchedResource(resourceContent: ResourceContent) {
        draftVersion = resourceContent.contentVersions.find((x) => x.isDraft);
        hasDraft = draftVersion !== undefined;

        publishedVersion = resourceContent.contentVersions.find((x) => x.isPublished);
        hasPublished = publishedVersion !== undefined;

        selectedVersion = draftVersion || publishedVersion || resourceContent.contentVersions[0];
        englishContentTranslation = resourceContent.contentTranslations.find((x) => x.languageId === 1);

        const currentUserIsAssigned = selectedVersion.assignedUser?.id === data.currentUser.id;

        isInTranslationWorkflow =
            resourceContent.status === ResourceContentStatusEnum.TranslationNotStarted ||
            resourceContent.status === ResourceContentStatusEnum.TranslationInReview ||
            resourceContent.status === ResourceContentStatusEnum.TranslationInProgress ||
            resourceContent.status === ResourceContentStatusEnum.TranslationReviewPending;

        canMakeContentEdits =
            data.currentUser.can(Permission.EditContent) &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInProgress ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationReviewPending ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInReview) &&
            currentUserIsAssigned;

        canAquiferize =
            data.currentUser.can(Permission.CreateContent) &&
            (resourceContent.status === ResourceContentStatusEnum.New ||
                resourceContent.status === ResourceContentStatusEnum.Complete ||
                resourceContent.status === ResourceContentStatusEnum.TranslationNotStarted);

        canAssign =
            (data.currentUser.can(Permission.AssignOverride) ||
                (data.currentUser.can(Permission.AssignContent) && currentUserIsAssigned)) &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInProgress);

        canSendBack =
            data.currentUser.can(Permission.AssignContent) &&
            currentUserIsAssigned &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInReview);

        canSendReview =
            data.currentUser.can(Permission.SendReviewContent) &&
            currentUserIsAssigned &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInProgress);

        canStartReview =
            data.currentUser.can(Permission.ReviewContent) &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeReviewPending ||
                resourceContent.status === ResourceContentStatusEnum.TranslationReviewPending);

        canPublish =
            data.currentUser.can(Permission.PublishContent) &&
            ((resourceContent.status === ResourceContentStatusEnum.New && !hasPublished) ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInReview);

        canUnpublish = data.currentUser.can(Permission.PublishContent) && hasPublished;
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

    function openAddTranslationModal() {
        createTranslationFromDraft = false;
        newTranslationLanguageId = null;
        addTranslationModal.showModal();
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
        await takeActionAndRefresh(() =>
            fetchFromApiWithAuth(`/admin/resources/content/${$updatedValues.contentId}/unpublish`, {
                method: 'POST',
            })
        );
    }

    async function sendReview() {
        await takeActionAndRefresh(() =>
            fetchFromApiWithAuth(
                `/admin/resources/content/${$updatedValues.contentId}/send-${
                    isInTranslationWorkflow ? 'translation-' : ''
                }review`,
                {
                    method: 'POST',
                }
            )
        );
    }

    async function startReview() {
        await takeActionAndRefresh(() =>
            fetchFromApiWithAuth(
                `/admin/resources/content/${$updatedValues.contentId}/review${
                    isInTranslationWorkflow ? '-translation' : ''
                }`,
                {
                    method: 'POST',
                }
            )
        );
    }

    async function aquiferize() {
        await takeActionAndRefresh(() =>
            fetchFromApiWithAuth(`/admin/resources/content/${$updatedValues.contentId}/aquiferize`, {
                method: 'POST',
                body: { assignedUserId: assignToUserId ? parseInt(assignToUserId) : null },
            })
        );
    }

    async function publish() {
        await takeActionAndRefresh(() =>
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
        await takeActionAndRefresh(() =>
            fetchFromApiWithAuth(
                `/admin/resources/content/${$updatedValues.contentId}/assign-${
                    isInTranslationWorkflow ? 'translator' : 'editor'
                }`,
                {
                    method: 'POST',
                    body: {
                        assignedUserId: assignToUserId ? parseInt(assignToUserId) : null,
                    },
                }
            )
        );
    }

    async function createTranslation() {
        await takeActionAndRefresh(() =>
            fetchFromApiWithAuth('/admin/resources/content/create-translation', {
                method: 'POST',
                body: {
                    languageId: parseInt(newTranslationLanguageId!),
                    baseContentId: englishContentTranslation?.contentId,
                    useDraft: createTranslationFromDraft,
                },
            })
        );
    }

    async function translate() {
        await takeActionAndRefresh(() =>
            fetchFromApiWithAuth(`/admin/resources/content/${$updatedValues.contentId}/assign-translator`, {
                method: 'POST',
                body: { assignedUserId: assignToUserId ? parseInt(assignToUserId) : null },
            })
        );
    }

    async function onSave() {
        $userStoppedEditing = false;
        isTransacting = true;
        showAutoSaveFailedMessage = false;
        try {
            await putData();
        } catch {
            if (!saveInterval) {
                saveInterval = window.setInterval(async () => {
                    await onSave();
                }, 20000);
            }
            saveRetries < 4 ? saveRetries++ : (showAutoSaveFailedMessage = true);
        } finally {
            if (putDataSuccess) {
                isTransacting = false;
                saveRetries = 0;
                showAutoSaveFailedMessage = false;
                putDataSuccess = false;
                clearInterval(saveInterval);
                saveInterval = undefined;
            }
        }
    }

    async function onSaveAndClose() {
        loadingModal.showModal();
        try {
            if (contentUpdated) {
                await putData();
            }
            goBack();
        } catch {
            loadingModal.close();
        }
    }

    function goBack() {
        window.history.length > 1 ? window.history.back() : goto('/resources');
    }

    async function putData() {
        await fetchFromApiWithAuth(`/admin/resources/content/summary/${$updatedValues.contentId}`, {
            method: 'PUT',
            body: {
                displayName: $updatedValues.displayName,
                content: $updatedValues.content,
                wordCount: ($updatedValues.wordCounts || []).reduce((total, current) => total + current, 0),
            },
        });

        putDataSuccess = true;

        updateOriginal();
    }

    function setSelectedVersion(version: ResourceContentVersion | undefined) {
        if (selectedVersion.isDraft) {
            draftVersion!.displayName = $updatedValues.displayName ?? '';
            draftVersion!.content = $updatedValues.content as unknown as ContentItem[];
        }
        selectedVersion = version!;
    }
</script>

{#await resourceContentPromise}
    <CenteredSpinner />
{:then resourceContent}
    <div class="p-8">
        <div class="mb-4 flex w-full items-center">
            <div class="mb-4 me-8 w-4/12">
                <h1 class="relative w-full text-2xl font-bold">
                    {resourceContent.parentResourceName} -
                    {$originalValues.displayName}
                </h1>
                {#if showAutoSaveFailedMessage}
                    <span class="absolute font-bold text-error">Auto-save failed</span>
                {/if}
            </div>

            <div class="flex w-8/12">
                <div class="flex w-full justify-between">
                    <div class="mb-4 flex items-center">
                        {#if isTransacting}
                            <Icon data={spinner} pulse class="text-[#0175a2]" />
                        {/if}
                    </div>
                    <div class="flex flex-wrap justify-end">
                        {#if hasDraft && hasPublished}
                            <div class="join mb-4 ms-4">
                                <button
                                    class="btn {selectedVersion.isDraft ? 'btn-primary' : ''} join-item"
                                    on:click={() => setSelectedVersion(draftVersion)}>Draft</button
                                >
                                <button
                                    class="btn {selectedVersion.isPublished ? 'btn-primary' : ''} join-item"
                                    class:btn-disabled={contentUpdated && !selectedVersion.isPublished}
                                    on:click={() => setSelectedVersion(publishedVersion)}>Published</button
                                >
                            </div>
                        {/if}
                        {#if canAssign || canSendBack}
                            <button
                                class="btn btn-primary mb-4 ms-4"
                                disabled={isTransacting}
                                on:click={openAssignUserModal}
                            >
                                {#if canAssign}
                                    Assign User
                                {:else if canSendBack}
                                    Send Back
                                {/if}
                            </button>
                        {/if}
                        {#if canPublish}
                            <button
                                class="btn btn-primary mb-4 ms-4"
                                disabled={isTransacting}
                                on:click={() => publishOrOpenModal(resourceContent.status)}
                                >Publish
                            </button>
                        {/if}
                        {#if canUnpublish}
                            <button
                                class="btn btn-primary mb-4 ms-4"
                                class:btn-disabled={isTransacting}
                                on:click={unpublish}
                                >Unpublish
                            </button>
                        {/if}
                        {#if canSendReview}
                            <button
                                class="btn btn-primary mb-4 ms-4"
                                class:btn-disabled={isTransacting}
                                on:click={() => confirmSendReviewModal.showModal()}
                                >Send to Review
                            </button>
                        {/if}
                        {#if canStartReview}
                            <button
                                class="btn btn-primary mb-4 ms-4"
                                class:btn-disabled={isTransacting}
                                on:click={startReview}
                                >Review
                            </button>
                        {/if}
                        {#if canAquiferize}
                            <button
                                class="btn btn-primary mb-4 ms-4"
                                class:btn-disabled={isTransacting}
                                on:click={openAquiferizeModal}
                                >{#if isInTranslationWorkflow}
                                    Translate
                                {:else}
                                    Aquiferize
                                {/if}
                            </button>
                        {/if}
                        <button class="btn btn-primary btn-outline mb-4 ms-4" on:click={onSaveAndClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex">
            <div class="me-8 flex max-h-full w-4/12 flex-col">
                <Overview
                    canEdit={canMakeContentEdits}
                    displayNameText={selectedVersion.displayName}
                    typeText={resourceContent.parentResourceName}
                    isPublished={hasPublished}
                    on:saveTitle={onSave}
                />
                <Process
                    translationStatus={resourceContent.status}
                    assignedUser={draftVersion?.assignedUser ?? null}
                    resourceContentStatuses={data.resourceContentStatuses}
                />
                <Translations
                    languages={data.languages}
                    translations={resourceContent.contentTranslations}
                    englishTranslation={englishContentTranslation}
                    canPublish
                    openModal={openAddTranslationModal}
                />
                <RelatedContent relatedContent={resourceContent.associatedResources} />
                <BibleReferences bibleReferences={getSortedReferences(resourceContent)} />
            </div>
            <div class="flex h-[85vh] w-8/12 flex-col">
                <Content
                    canEdit={canMakeContentEdits && selectedVersion.isDraft}
                    resourceContentVersion={selectedVersion}
                    contentId={resourceContent.resourceContentId}
                    mediaType={resourceContent.mediaType}
                />
            </div>
        </div>
    </div>

    <dialog bind:this={aquiferizeModal} class="modal">
        <div class="modal-box">
            <h3 class="w-full pb-4 text-center text-xl font-bold">
                {#if isInTranslationWorkflow}
                    Choose a Translator
                {:else}
                    Choose an Editor
                {/if}
            </h3>
            <div class="flex flex-col">
                <UserSelector users={data.users} defaultLabel="Select User" bind:selectedUserId={assignToUserId} />
                <div class="flex w-full flex-row space-x-2 pt-4">
                    <div class="flex-grow" />
                    <button
                        class="btn btn-primary"
                        on:click={isInTranslationWorkflow ? translate : aquiferize}
                        disabled={assignToUserId === null}>Assign</button
                    >
                    <button class="btn btn-primary btn-outline" on:click={() => aquiferizeModal.close()}>Cancel</button>
                </div>
            </div>
        </div>
    </dialog>

    <dialog bind:this={assignUserModal} class="modal">
        <div class="modal-box">
            <h3 class="w-full pb-4 text-center text-xl font-bold">
                {#if isInTranslationWorkflow}
                    Choose a Translator
                {:else}
                    Choose an Editor
                {/if}
            </h3>
            <div class="flex flex-col">
                <UserSelector
                    users={data.users}
                    defaultLabel="Select User"
                    bind:selectedUserId={assignToUserId}
                    hideUser={selectedVersion.assignedUser}
                />
                <div class="flex w-full flex-row space-x-2 pt-4">
                    <div class="flex-grow" />
                    <button
                        class="btn btn-primary"
                        on:click={assignUser}
                        disabled={assignToUserId === null || isTransacting}>Assign</button
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
                    <button class="btn btn-primary" on:click={publish} disabled={isTransacting}>Publish</button>
                    <button class="btn btn-primary btn-outline" on:click={() => publishModal.close()}>Cancel</button>
                </div>
            </div>
        </div>
    </dialog>

    <dialog bind:this={addTranslationModal} class="modal">
        <div class="modal-box">
            <h3 class="w-full pb-4 text-center text-xl font-bold">Create translation</h3>
            <div class="flex flex-col">
                <TranslationSelector
                    allLanguages={data.languages}
                    existingTranslations={resourceContent.contentTranslations}
                    bind:selectedLanguageId={newTranslationLanguageId}
                />
                <div class="flex w-full flex-row space-x-2 pt-4">
                    {#if englishContentTranslation?.hasDraft}
                        <div>
                            <label class="label cursor-pointer">
                                <input
                                    type="checkbox"
                                    class="checkbox-primary checkbox me-2"
                                    bind:checked={createTranslationFromDraft}
                                />
                                <span class="label-text">Create from Draft</span>
                            </label>
                        </div>
                    {/if}
                    <div class="flex-grow" />
                    <button
                        class="btn btn-primary"
                        on:click={createTranslation}
                        disabled={newTranslationLanguageId === null || isTransacting}>Create</button
                    >
                    <button class="btn btn-primary btn-outline" on:click={() => addTranslationModal.close()}
                        >Cancel</button
                    >
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
                    <button class="btn btn-primary" on:click={sendReview} disabled={isTransacting}
                        >Send to Review</button
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
{:catch}
    <div class="p-8">Resource not found</div>
{/await}

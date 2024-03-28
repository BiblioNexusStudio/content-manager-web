<script lang="ts">
    import type { PageData } from './$types';
    import Content from '$lib/components/resources/Content.svelte';
    import { beforeNavigate, goto } from '$app/navigation';
    import {
        type ResourceContent,
        type ContentTranslation,
        type BasicSnapshot,
        type Snapshot,
        MediaTypeEnum,
        type TiptapContentItem,
    } from '$lib/types/resources';
    import { getFromApi, postToApi, putToApi } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import UserSelector from './UserSelector.svelte';
    import { Permission, userCan, userIsEqual, userIsInCompany } from '$lib/stores/auth';
    import { commentThreads, removeAllInlineThreads } from '$lib/stores/comments';
    import spinner from 'svelte-awesome/icons/spinner';
    import { Icon } from 'svelte-awesome';
    import TranslationSelector from './TranslationSelector.svelte';
    import { createAutosaveStore } from '$lib/utils/auto-save-store';
    import { onDestroy } from 'svelte';
    import Modal from '$lib/components/Modal.svelte';
    import createChangeTrackingStore from '$lib/utils/change-tracking-store';
    import { get } from 'svelte/store';
    import ExitButton from '$lib/components/ExitButton.svelte';
    import CurrentTranslations from '$lib/components/resources/menus/CurrentTranslations.svelte';
    import Related from '$lib/components/resources/menus/Related.svelte';
    import References from '$lib/components/resources/menus/References.svelte';
    import ContentArea from '$lib/components/resources/ContentArea.svelte';
    import Select from '$lib/components/Select.svelte';
    import InlineComment from '$lib/components/comments/InlineComment.svelte';
    import { formatDate } from '$lib/utils/date-time';
    import { getSortedReferences } from '$lib/utils/reference';
    import LicenseInfoButton from './LicenseInfoButton.svelte';

    let errorModal: HTMLDialogElement;
    let autoSaveErrorModal: HTMLDialogElement;
    let aquiferizeModal: HTMLDialogElement;
    let assignUserModal: HTMLDialogElement;
    let publishModal: HTMLDialogElement;
    let addTranslationModal: HTMLDialogElement;
    let confirmSendReviewModal: HTMLDialogElement;

    let assignToUserId: number | null = null;
    let newTranslationLanguageId: string | null = null;
    let currentUserIsAssigned = false;
    let canMakeContentEdits = false;
    let canAquiferize = false;
    let canAssign = false;
    let canSendBack = false;
    let canPublish = false;
    let canUnpublish = false;
    let canSendReview = false;
    let canAssignReview = false;
    let _canCreateTranslation = false;
    let isAssignReviewModalOpen = false;
    let isInReview = false;
    let createDraft = false;
    let englishContentTranslation: ContentTranslation | undefined;
    let createTranslationFromDraft = false;
    let isInTranslationWorkflow = false;
    let isLoadingSnapshot = false;
    let mediaType: MediaTypeEnum | undefined;
    let selectedSnapshotId: number | null = null;
    let selectedStepNumber: number | undefined;
    let isShowingDiffs = false;
    let isEnglish = false;

    let canAiSimplify = $userCan(Permission.AiSimplify);

    export let data: PageData;

    const { save, resetSaveState, isSaving, showSavingFailed } = createAutosaveStore(putData);

    let editableContentStore = createChangeTrackingStore<TiptapContentItem[]>([], {
        onChange: save,
        debounceDelay: 3000,
    });
    let editableDisplayNameStore = createChangeTrackingStore<string>('', { onChange: save, debounceDelay: 3000 });
    let wordCountsByStep: number[] = [];
    let cachedSnapshots: Record<number, Snapshot> = {};
    let firstSnapshotId: number | null = null;

    $: resourceContentId = data.resourceContentId;
    $: resourceContentPromise = data.resourceContent.promise;
    $: handleFetchedResource(data.resourceContent.promise);
    $: loadSnapshot(selectedSnapshotId);
    $: hasUnresolvedThreads = $commentThreads?.threads.some((x) => !x.resolved && x.id !== -1) || false;

    async function handleFetchedResource(resourceContentPromise: Promise<ResourceContent>) {
        const resourceContent = await resourceContentPromise;
        resetSaveState();

        mediaType = resourceContent.mediaType;
        resourceContent.snapshots.reverse();
        firstSnapshotId = resourceContent.snapshots[0]?.id ?? null;
        isEnglish = resourceContent.language.iso6393Code.toLowerCase() === 'eng';

        englishContentTranslation = resourceContent.contentTranslations.find((x) => x.languageId === 1);

        currentUserIsAssigned = $userIsEqual(resourceContent.assignedUser?.id);
        const assignedUserIsInCompany = $userIsInCompany(resourceContent.assignedUser?.companyId);

        isInReview =
            resourceContent.status === ResourceContentStatusEnum.TranslationInReview ||
            resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview;

        isInTranslationWorkflow =
            resourceContent.status === ResourceContentStatusEnum.TranslationNotStarted ||
            resourceContent.status === ResourceContentStatusEnum.TranslationInReview ||
            resourceContent.status === ResourceContentStatusEnum.TranslationInProgress ||
            resourceContent.status === ResourceContentStatusEnum.TranslationReviewPending;

        canMakeContentEdits =
            $userCan(Permission.EditContent) &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInProgress ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationReviewPending ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInReview) &&
            currentUserIsAssigned;

        canAquiferize =
            $userCan(Permission.CreateContent) &&
            (resourceContent.status === ResourceContentStatusEnum.New ||
                resourceContent.status === ResourceContentStatusEnum.Complete ||
                resourceContent.status === ResourceContentStatusEnum.TranslationNotStarted);

        canAssign =
            (($userCan(Permission.AssignOverride) &&
                ($userCan(Permission.AssignOutsideCompany) || assignedUserIsInCompany)) ||
                ($userCan(Permission.AssignContent) && currentUserIsAssigned)) &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInProgress);

        canSendBack =
            $userCan(Permission.AssignContent) &&
            currentUserIsAssigned &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInReview);

        canSendReview =
            $userCan(Permission.SendReviewContent) &&
            currentUserIsAssigned &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInProgress);

        canAssignReview =
            $userCan(Permission.ReviewContent) &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeReviewPending ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationReviewPending);

        canPublish =
            $userCan(Permission.PublishContent) &&
            ((resourceContent.status === ResourceContentStatusEnum.New && !resourceContent.hasPublishedVersion) ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizeInReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInReview);

        canUnpublish = $userCan(Permission.PublishContent) && resourceContent.hasPublishedVersion;
        _canCreateTranslation = $userCan(Permission.PublishContent);
        if (!('url' in resourceContent.content)) {
            editableContentStore.setOriginalAndCurrent(resourceContent.content);
        }
        editableDisplayNameStore.setOriginalAndCurrent(resourceContent.displayName);

        if (resourceContent.commentThreads) {
            resourceContent.commentThreads.threads.push({
                id: -1,
                resolved: false,
                comments: [],
            });
            $commentThreads = resourceContent.commentThreads;
        } else {
            $commentThreads = null;
        }
    }

    let isTransacting = false;

    beforeNavigate(async ({ to, cancel }) => {
        // beforeNavigate runs synchronously, but we can work around the limitation by always canceling the
        // navigation up front, and then conditionally doing a `goto` if the save is successful.
        // See https://github.com/sveltejs/kit/issues/4421#issuecomment-1129879937
        if (get(editableContentStore.hasChanges) || get(editableDisplayNameStore.hasChanges)) {
            cancel();
            if (!(await save(true))) {
                autoSaveErrorModal.showModal();
            } else {
                to?.url && (await goto(to.url));
            }
        }
    });

    onDestroy(resetSaveState);

    function openAquiferizeModal() {
        assignToUserId = null;
        aquiferizeModal.showModal();
    }

    function publishOrOpenModal(status: ResourceContentStatusEnum) {
        assignToUserId = null;
        createDraft = false;
        if (status === ResourceContentStatusEnum.New || hasUnresolvedThreads) {
            publishModal.showModal();
        } else {
            publish();
        }
    }

    function openAssignUserModal() {
        assignToUserId = null;
        assignUserModal.showModal();
    }

    function openAssignReviewModal() {
        assignToUserId = currentUserIsAssigned ? null : data.currentUser.id;
        isAssignReviewModalOpen = true;
    }

    function openAddTranslationModal() {
        createTranslationFromDraft = false;
        newTranslationLanguageId = null;
        addTranslationModal.showModal();
    }

    async function takeActionAndRefresh(action: () => Promise<unknown>) {
        isTransacting = true;
        if (get(editableDisplayNameStore.hasChanges) || get(editableContentStore.hasChanges)) {
            await putData();
        }
        try {
            await action();
            window.location.reload(); // do this for now. eventually we want to have the post return the new state of the resource so we don't need to refresh
        } catch (error) {
            errorModal.showModal();
            isTransacting = false;
            throw error;
        }
    }

    async function unpublish() {
        await takeActionAndRefresh(() => postToApi(`/admin/resources/content/${resourceContentId}/unpublish`));
    }

    async function sendReview() {
        $removeAllInlineThreads();
        await takeActionAndRefresh(() =>
            postToApi(
                isInTranslationWorkflow
                    ? `/admin/resources/content/${resourceContentId}/send-translation-review`
                    : `/admin/resources/content/${resourceContentId}/send-review`
            )
        );
    }

    async function assignReview() {
        await takeActionAndRefresh(() =>
            postToApi(`/resources/content/${resourceContentId}/assign-review`, {
                assignedUserId: assignToUserId,
            })
        );
    }

    async function aquiferize() {
        await takeActionAndRefresh(() =>
            postToApi(`/admin/resources/content/${resourceContentId}/aquiferize`, {
                assignedUserId: assignToUserId,
            })
        );
    }

    async function publish() {
        $removeAllInlineThreads();
        await takeActionAndRefresh(() =>
            postToApi(`/admin/resources/content/${resourceContentId}/publish`, {
                createDraft: createDraft,
                assignedUserId: assignToUserId,
            })
        );
    }

    async function assignUser() {
        await takeActionAndRefresh(() =>
            postToApi(
                isInTranslationWorkflow
                    ? `/admin/resources/content/${resourceContentId}/assign-translator`
                    : `/admin/resources/content/${resourceContentId}/assign-editor`,
                {
                    assignedUserId: assignToUserId,
                }
            )
        );
    }

    async function createTranslation() {
        await takeActionAndRefresh(() =>
            postToApi('/admin/resources/content/create-translation', {
                languageId: parseInt(newTranslationLanguageId!),
                baseContentId: englishContentTranslation?.contentId,
                useDraft: createTranslationFromDraft,
            })
        );
    }

    async function translate() {
        await takeActionAndRefresh(() =>
            postToApi(`/admin/resources/content/${resourceContentId}/assign-translator`, {
                assignedUserId: assignToUserId,
            })
        );
    }

    function calculateWordCount(wordCounts: number[]) {
        if (wordCounts.length) {
            return wordCounts.reduce((total, current) => total + current, 0);
        }
    }

    async function loadSnapshot(snapshotId: number | null) {
        if (!snapshotId) return;

        if (!cachedSnapshots[snapshotId]) {
            try {
                isLoadingSnapshot = true;
                const snapshot = await getFromApi<Snapshot>(`/resources/content/snapshots/${snapshotId}`);
                if (snapshot) {
                    cachedSnapshots[snapshotId] = snapshot;
                }
            } finally {
                isLoadingSnapshot = false;
            }
        }
    }

    async function putData() {
        const displayName = get(editableDisplayNameStore);
        const content = get(editableContentStore);
        await putToApi(`/admin/resources/content/summary/${resourceContentId}`, {
            displayName,
            wordCount: calculateWordCount(wordCountsByStep),
            ...(mediaType === MediaTypeEnum.text ? { content } : null),
        });

        editableDisplayNameStore.setOriginalOnly(displayName);
        editableContentStore.setOriginalOnly(content);
    }

    function usersThatCanBeAssigned() {
        if ($userCan(Permission.AssignOutsideCompany)) {
            return data.users;
        }
        return data.users?.filter((u) => $userIsInCompany(u.company.id)) ?? null;
    }

    function calculateSnapshotName(snapshot: BasicSnapshot, isFirst: boolean) {
        if (isFirst && isEnglish) {
            return `${formatDate(snapshot.created)}`;
        } else if (isFirst) {
            return `${formatDate(snapshot.created)} English Source`;
        } else {
            return `${formatDate(snapshot.created)} ${snapshot.assignedUserName ?? ''} ${snapshot.status}`;
        }
    }

    function toggleHistoryPane() {
        if (selectedSnapshotId === null) {
            selectedSnapshotId = firstSnapshotId;
        } else {
            selectedSnapshotId = null;
        }
    }
</script>

{#await resourceContentPromise}
    <CenteredSpinner />
{:then resourceContent}
    <div class="p-8">
        <div class="flex w-full items-center justify-between border-b-2 pb-2">
            <div class="me-2 flex place-items-center">
                <ExitButton defaultPathIfNoHistory="/resources" />
                <CurrentTranslations
                    currentResourceId={resourceContentId}
                    languages={data.languages}
                    translations={resourceContent.contentTranslations}
                    project={resourceContent.project}
                    englishTranslation={englishContentTranslation}
                    canCreateTranslation={_canCreateTranslation}
                    openModal={openAddTranslationModal}
                />
                <Related relatedContent={resourceContent.associatedResources} />
                <References bibleReferences={getSortedReferences(resourceContent)} />
            </div>

            <div class="flex">
                <div class="flex w-full justify-end">
                    <div class="me-2 flex items-center">
                        {#if $showSavingFailed}
                            <span class="font-bold text-error">Auto-save failed</span>
                        {/if}
                        {#if $isSaving}
                            <Icon data={spinner} pulse class="text-[#0175a2]" />
                        {/if}
                    </div>
                    <div class="flex flex-wrap justify-end">
                        {#if canAiSimplify && mediaType === MediaTypeEnum.text}
                            <button
                                class="btn btn-primary"
                                on:click={() => goto(`/resources/${resourceContentId}/simplify`)}>AI Aquiferize</button
                            >
                        {/if}
                        {#if canAssign || canSendBack}
                            <button
                                class="btn btn-primary ms-2"
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
                        {#if canAssignReview}
                            <button
                                class="btn btn-primary ms-2"
                                class:btn-disabled={isTransacting}
                                on:click={openAssignReviewModal}
                                >{isInReview ? 'Assign' : 'Review'}
                            </button>
                        {/if}
                        {#if canPublish}
                            <button
                                class="btn btn-primary ms-2"
                                disabled={isTransacting}
                                on:click={() => publishOrOpenModal(resourceContent.status)}
                                >Publish
                            </button>
                        {/if}
                        {#if canUnpublish}
                            <button class="btn btn-primary ms-2" class:btn-disabled={isTransacting} on:click={unpublish}
                                >Unpublish
                            </button>
                        {/if}
                        {#if canSendReview}
                            <button
                                class="btn btn-primary ms-2"
                                class:btn-disabled={isTransacting}
                                on:click={() => confirmSendReviewModal.showModal()}
                                >Send to Review
                            </button>
                        {/if}
                        {#if canAquiferize}
                            <button
                                class="btn btn-primary ms-2"
                                class:btn-disabled={isTransacting}
                                on:click={openAquiferizeModal}
                                >{#if isInTranslationWorkflow}
                                    Translate
                                {:else}
                                    Aquiferize
                                {/if}
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <ContentArea
            {resourceContent}
            {selectedSnapshotId}
            onToggleHistoryPane={toggleHistoryPane}
            resourceContentStatuses={data.resourceContentStatuses}
        />

        <div class="h-[calc(100vh-250px)]">
            <div class="float-left h-full transition-[width] {selectedSnapshotId === null ? 'w-full' : 'w-1/2 pe-3'}">
                <div class="h-full rounded-md bg-base-200 p-4">
                    <div class="mx-auto flex h-full w-full max-w-4xl flex-col space-y-4">
                        {#if canMakeContentEdits && resourceContent.isDraft}
                            <input
                                bind:value={$editableDisplayNameStore}
                                class="input input-bordered h-8 w-full max-w-[18rem] leading-8"
                                type="text"
                            />
                        {:else}
                            <div class="mb-2 text-lg">{$editableDisplayNameStore}</div>
                        {/if}
                        <div class="w-full flex-grow">
                            <Content
                                bind:selectedStepNumber
                                {editableContentStore}
                                bind:wordCountsByStep
                                canEdit={canMakeContentEdits && resourceContent.isDraft}
                                canComment={resourceContent.isDraft}
                                {resourceContent}
                            />
                        </div>
                        <div class="flex flex-row items-center space-x-2">
                            {#if resourceContent.parentResourceLicenseInfo}
                                <LicenseInfoButton {resourceContent} />
                            {/if}
                            {#if mediaType === MediaTypeEnum.text}
                                <div class="text-sm text-gray-500">
                                    Word count: {calculateWordCount(wordCountsByStep) || resourceContent.wordCount}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="float-right h-full overflow-hidden transition-[width] {selectedSnapshotId === null
                    ? 'w-0'
                    : 'w-1/2 ps-3'}"
            >
                <div class="flex h-full w-full flex-col rounded-md border border-base-300 p-4">
                    <div class="mx-auto flex h-full w-full max-w-4xl flex-col space-y-4">
                        <Select
                            bind:value={selectedSnapshotId}
                            class="select select-bordered select-sm"
                            isNumber={true}
                            options={resourceContent.snapshots.map((s, i) => ({
                                value: s.id,
                                label: calculateSnapshotName(s, i === resourceContent.snapshots.length - 1),
                            }))}
                        />
                        {#if selectedSnapshotId}
                            {@const selectedSnapshot = cachedSnapshots[selectedSnapshotId]}
                            {#if selectedSnapshot}
                                <div class="flex h-6 w-full flex-row items-center">
                                    <div class="text-lg">{selectedSnapshot.displayName}</div>
                                    <div class="grow"></div>
                                    <div class="text-lg">
                                        <label class="label cursor-pointer py-0">
                                            <input
                                                type="checkbox"
                                                bind:checked={isShowingDiffs}
                                                class="checkbox no-animation checkbox-sm me-2"
                                            />
                                            <span class="label-text text-xs">Differences</span>
                                        </label>
                                    </div>
                                </div>
                                <Content
                                    bind:selectedStepNumber
                                    isComparingToCurrent={isShowingDiffs}
                                    {editableContentStore}
                                    snapshot={selectedSnapshot}
                                    {resourceContent}
                                />
                                {#if mediaType === MediaTypeEnum.text}
                                    <div class="flex h-10 flex-row items-center text-sm text-gray-500">
                                        Word count: {selectedSnapshot.wordCount}
                                    </div>
                                {/if}
                            {:else if isLoadingSnapshot}
                                <CenteredSpinner />
                            {:else}
                                Error fetching...
                            {/if}
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <Modal
        primaryButtonText="Assign"
        primaryButtonOnClick={assignReview}
        primaryButtonDisabled={!assignToUserId}
        bind:open={isAssignReviewModalOpen}
        header="Choose a Reviewer"
    >
        <UserSelector
            users={data.users?.filter((u) => u.role === UserRole.Publisher) ?? []}
            hideUser={resourceContent.assignedUser}
            defaultLabel="Select User"
            bind:selectedUserId={assignToUserId}
        />
    </Modal>

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
                <UserSelector
                    users={usersThatCanBeAssigned()}
                    defaultLabel="Select User"
                    bind:selectedUserId={assignToUserId}
                />
                <div class="flex w-full flex-row space-x-2 pt-4">
                    <div class="flex-grow" />
                    <button
                        class="btn btn-primary"
                        on:click={isInTranslationWorkflow ? translate : aquiferize}
                        disabled={assignToUserId === null}>Assign</button
                    >
                    <button class="btn btn-outline btn-primary" on:click={() => aquiferizeModal.close()}>Cancel</button>
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
                    users={usersThatCanBeAssigned()}
                    defaultLabel="Select User"
                    bind:selectedUserId={assignToUserId}
                    hideUser={resourceContent.assignedUser}
                />
                <div class="flex w-full flex-row space-x-2 pt-4">
                    <div class="flex-grow" />
                    <button
                        class="btn btn-primary"
                        on:click={assignUser}
                        disabled={assignToUserId === null || isTransacting}>Assign</button
                    >
                    <button class="btn btn-outline btn-primary" on:click={() => assignUserModal.close()}>Cancel</button>
                </div>
            </div>
        </div>
    </dialog>

    <dialog bind:this={publishModal} class="modal">
        <div class="modal-box">
            <h3 class="w-full pb-4 text-center text-xl font-bold">
                {hasUnresolvedThreads && resourceContent.status !== ResourceContentStatusEnum.New
                    ? 'Confirm Publish'
                    : 'Choose Publish Option'}
            </h3>
            <div class="flex flex-col">
                {#if hasUnresolvedThreads && resourceContent.status !== ResourceContentStatusEnum.New}
                    <p class="py-4 text-lg text-warning">This resource has unresolved comments.</p>
                {/if}
                {#if resourceContent.status === ResourceContentStatusEnum.New}
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
                            users={usersThatCanBeAssigned()}
                            defaultLabel="Unassigned"
                            disabled={!createDraft}
                            bind:selectedUserId={assignToUserId}
                        />
                    </label>
                {/if}
                <div class="flex w-full flex-row space-x-2 pt-4">
                    <div class="flex-grow" />
                    <button class="btn btn-primary" on:click={publish} disabled={isTransacting}>Publish</button>
                    <button class="btn btn-outline btn-primary" on:click={() => publishModal.close()}>Cancel</button>
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
                    <button class="btn btn-outline btn-primary" on:click={() => addTranslationModal.close()}
                        >Cancel</button
                    >
                </div>
            </div>
        </div>
    </dialog>

    <dialog bind:this={confirmSendReviewModal} class="modal">
        <div class="modal-box">
            <h3 class="text-xl font-bold">Confirm Send to Review</h3>
            {#if hasUnresolvedThreads}
                <p class="pt-4 text-lg text-warning">This resource has unresolved comments.</p>
            {/if}
            <p class="py-4 text-lg">Have you completed your editing? Your assignment will be removed.</p>
            <div class="modal-action pt-4">
                <form method="dialog">
                    <button class="btn btn-primary" on:click={sendReview} disabled={isTransacting}
                        >Send to Review</button
                    >
                    <button class="btn btn-outline btn-primary">Cancel</button>
                </form>
            </div>
        </div>
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

    <dialog bind:this={autoSaveErrorModal} class="modal">
        <div class="modal-box bg-error">
            <form method="dialog">
                <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">✕</button>
            </form>
            <h3 class="text-xl font-bold">Error</h3>
            <p class="py-4 text-lg font-medium">
                You have unsaved edits that could not be saved. Please ensure they save before navigating away.
            </p>
        </div>
    </dialog>

    <InlineComment />
{/await}

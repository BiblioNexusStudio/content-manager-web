<script lang="ts">
    import type { PageData } from './$types';
    import Content from '$lib/components/resources/Content.svelte';
    import { beforeNavigate, goto } from '$app/navigation';
    import {
        type ContentTranslation,
        MediaTypeEnum,
        type ResourceContent,
        type TiptapContentItem,
        type ResourceContentNextUpInfo,
        OpenedSupplementalSideBar,
        type Assignment,
    } from '$lib/types/resources';
    import { getFromApi, patchToApi, postToApi } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import UserSelector from './UserSelector.svelte';
    import {
        currentUser,
        isAuthenticatedStore,
        Permission,
        userCan,
        userIsEqual,
        userIsInCompany,
    } from '$lib/stores/auth';
    import { type CommentStores, createCommentStores } from '$lib/stores/comments';
    import spinner from 'svelte-awesome/icons/spinner';
    import { Icon } from 'svelte-awesome';
    import TranslationSelector from './TranslationSelector.svelte';
    import { createAutosaveStore } from '$lib/utils/auto-save-store';
    import { onDestroy, onMount } from 'svelte';
    import Modal from '$lib/components/Modal.svelte';
    import createChangeTrackingStore from '$lib/utils/change-tracking-store';
    import { get, type Readable, type Writable } from 'svelte/store';
    import ExitButton from '$lib/components/ExitButton.svelte';
    import CurrentTranslations from '$lib/components/resources/menus/CurrentTranslations.svelte';
    import Related from '$lib/components/resources/menus/Related.svelte';
    import ContentArea from '$lib/components/resources/ContentArea.svelte';
    import Select from '$lib/components/Select.svelte';
    import InlineComment from '$lib/components/comments/InlineComment.svelte';
    import VersePopout from '$lib/components/editorMarkPopouts/VersePopout.svelte';
    import { getSortedReferences, stripOutRtlVerseReferenceMarkers } from '$lib/utils/reference';
    import LicenseInfoButton from './LicenseInfoButton.svelte';
    import type { CommentThreadsResponse } from '$lib/types/comments';
    import { createSidebarContentStore } from './sidebar-content-store';
    import CommentsSidebar from '$lib/components/comments/CommentsSidebar.svelte';
    import { createMachineTranslationStore } from '$lib/stores/machineTranslation';
    import MachineTranslationRating from '$lib/components/MachineTranslationRating.svelte';
    import { fly } from 'svelte/transition';
    import BibleReferencesSidebar from './BibleReferencesSidebar.svelte';
    import { log } from '$lib/logger';
    import { createIsPageTransactingContext } from '$lib/context/is-page-transacting-context';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import ScrollSyncLockToggle from '$lib/components/editor/ScrollSyncLockToggle.svelte';
    import { scrollPosition, scrollSyncSourceDiv } from '$lib/stores/scrollSync';
    import { isApiErrorWithMessage } from '$lib/utils/http-errors';

    let commentStores: CommentStores;
    let commentThreads: Writable<CommentThreadsResponse | null>;
    let removeAllInlineThreads: Readable<() => void>;

    let errorModal: HTMLDialogElement;
    let autoSaveErrorModal: HTMLDialogElement;
    let aquiferizeModal: HTMLDialogElement;
    let assignUserModal: HTMLDialogElement;
    let publishModal: HTMLDialogElement;
    let addTranslationModal: HTMLDialogElement;

    let assignToUserId: number | null = null;
    let newTranslationLanguageId: number | null = null;
    let currentUserIsAssigned = false;
    let canMakeContentEdits = false;
    let canAquiferize = false;
    let canAssign = false;
    let canSendBack = false;
    let canPublish = false;
    let canUnpublish = false;
    let canSendForManagerReview = false;
    let canPullBackToManagerReview = false;
    let canSendForPublisherReview = false;
    let canAssignPublisherForReview = false;
    let _canCreateTranslation = false;
    let isAssignReviewModalOpen = false;
    let isInReview = false;
    let createDraft = false;
    let englishContentTranslation: ContentTranslation | undefined;
    let createTranslationFromDraft = false;
    let isInTranslationWorkflow = false;
    let isNewDraftStatus = false;
    let mediaType: MediaTypeEnum | undefined;
    let selectedStepNumber: number | undefined;
    let isShowingDiffs = false;
    let openedSupplementalSideBar = OpenedSupplementalSideBar.None;
    let shouldTransition = false;
    let resourceContent: ResourceContent | undefined;
    let canCommunityTranslate = false;
    let canCommunitySendToPublisher = false;

    export let data: PageData;

    const { save, resetSaveState, isSaving, showSavingFailed } = createAutosaveStore(patchData);

    let editableContentStore = createChangeTrackingStore<TiptapContentItem[]>([], {
        onChange: save,
        debounceDelay: 3000,
    });
    let editableDisplayNameStore = createChangeTrackingStore<string>('', { onChange: save, debounceDelay: 3000 });
    let wordCountsByStep: number[] = [];
    let sidebarContentStore: ReturnType<typeof createSidebarContentStore>;

    $: isShowingSupplementalSidebar = openedSupplementalSideBar != OpenedSupplementalSideBar.None;
    $: resourceContentId = data.resourceContentId;
    $: resourceContentPromise = data.resourceContent.promise;
    $: handleFetchedResource(data.resourceContent.promise);
    $: hasUnresolvedThreads = $commentThreads?.threads.some((x) => !x.resolved && x.id !== -1) || false;

    const machineTranslationStore = createMachineTranslationStore();
    const promptForMachineTranslationRating = machineTranslationStore.promptForRating;

    async function handleFetchedResource(resourceContentPromise: Promise<ResourceContent>) {
        resourceContent = await resourceContentPromise;
        resetSaveState();

        $isPageTransacting = false;

        mediaType = resourceContent.mediaType;
        sidebarContentStore = createSidebarContentStore(resourceContent);

        englishContentTranslation = resourceContent.contentTranslations.find((x) => x.languageId === 1);

        currentUserIsAssigned = $userIsEqual(resourceContent.assignedUser?.id);
        const assignedUserIsInCompany = $userIsInCompany(resourceContent.assignedUser?.companyId);

        isInReview =
            resourceContent.status === ResourceContentStatusEnum.TranslationPublisherReview ||
            resourceContent.status === ResourceContentStatusEnum.AquiferizePublisherReview;

        isInTranslationWorkflow =
            resourceContent.status === ResourceContentStatusEnum.TranslationNotStarted ||
            resourceContent.status === ResourceContentStatusEnum.TranslationPublisherReview ||
            resourceContent.status === ResourceContentStatusEnum.TranslationInProgress ||
            resourceContent.status === ResourceContentStatusEnum.TranslationReviewPending;

        isNewDraftStatus = resourceContent.status === ResourceContentStatusEnum.New && resourceContent.isDraft;

        canMakeContentEdits =
            $userCan(Permission.EditContent) &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInProgress ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizePublisherReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationReviewPending ||
                resourceContent.status === ResourceContentStatusEnum.TranslationPublisherReview ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizeManagerReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationManagerReview) &&
            currentUserIsAssigned;

        const hasResourceAssignmentPermission =
            ($userCan(Permission.AssignOverride) &&
                ($userCan(Permission.AssignOutsideCompany) || assignedUserIsInCompany)) ||
            ($userCan(Permission.AssignContent) && currentUserIsAssigned);

        canAquiferize =
            hasResourceAssignmentPermission &&
            (resourceContent.status === ResourceContentStatusEnum.New ||
                resourceContent.status === ResourceContentStatusEnum.Complete ||
                resourceContent.status === ResourceContentStatusEnum.TranslationNotStarted);

        canAssign =
            hasResourceAssignmentPermission &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInProgress ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizeManagerReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationManagerReview);

        canSendBack =
            $userCan(Permission.AssignContent) &&
            currentUserIsAssigned &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizePublisherReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationPublisherReview);

        canSendForManagerReview =
            $userCan(Permission.AssignContent) &&
            currentUserIsAssigned &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress ||
                resourceContent.status === ResourceContentStatusEnum.TranslationInProgress);

        canPullBackToManagerReview = resourceContent.canPullBackToManagerReview;

        canSendForPublisherReview =
            $userCan(Permission.SendReviewContent) &&
            currentUserIsAssigned &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeManagerReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationManagerReview);

        canAssignPublisherForReview =
            $userCan(Permission.ReviewContent) &&
            (resourceContent.status === ResourceContentStatusEnum.AquiferizeReviewPending ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizePublisherReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationPublisherReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationReviewPending);

        canPublish =
            $userCan(Permission.PublishContent) &&
            ((resourceContent.status === ResourceContentStatusEnum.New && !resourceContent.hasPublishedVersion) ||
                resourceContent.status === ResourceContentStatusEnum.AquiferizePublisherReview ||
                resourceContent.status === ResourceContentStatusEnum.TranslationPublisherReview);

        canUnpublish = $userCan(Permission.PublishContent) && resourceContent.hasPublishedVersion;

        _canCreateTranslation = $userCan(Permission.PublishContent);
        if (!('url' in resourceContent.content)) {
            editableContentStore.setOriginalAndCurrent(resourceContent.content);
        }
        editableDisplayNameStore.setOriginalAndCurrent(resourceContent.displayName);

        machineTranslationStore.resetStore();
        machineTranslationStore.machineTranslations.set(
            new Map(resourceContent.machineTranslations.map((mt) => [mt.contentIndex, mt]))
        );
        promptForMachineTranslationRating.set(
            resourceContent.machineTranslations.some((mt) => !mt.userRating && $userIsEqual(mt.userId))
        );

        commentStores = createCommentStores();
        commentThreads = commentStores.commentThreads;
        removeAllInlineThreads = commentStores.removeAllInlineThreads;

        if (resourceContent.commentThreads) {
            // Add a dummy thread for a new comment span to live on. If a comment is added, then create the thread
            // with the new threadId from the server.
            resourceContent.commentThreads.threads.push({
                id: -1,
                resolved: false,
                comments: [],
            });
            $commentThreads = resourceContent.commentThreads;
        } else {
            $commentThreads = null;
        }

        canCommunityTranslate =
            $userCan(Permission.CreateCommunityContent) &&
            !resourceContent.contentTranslations.find((x) => x.languageId === $currentUser?.languageId) &&
            resourceContent.hasPublishedVersion === true &&
            $currentUser?.hasAssignedContent === false;

        canCommunitySendToPublisher =
            $userCan(Permission.SendReviewCommunityContent) &&
            resourceContent.status == ResourceContentStatusEnum.TranslationInProgress &&
            currentUserIsAssigned;
    }

    const isPageTransacting = createIsPageTransactingContext();

    beforeNavigate(async ({ to, cancel }) => {
        if ($scrollSyncSourceDiv) {
            $scrollSyncSourceDiv.scrollTop = 0;
        }
        $scrollPosition = 0;

        // beforeNavigate runs synchronously, but we can work around the limitation by always canceling the
        // navigation up front, and then conditionally doing a `goto` if the save is successful.
        // See https://github.com/sveltejs/kit/issues/4421#issuecomment-1129879937
        if (get(editableContentStore.hasChanges) || get(editableDisplayNameStore.hasChanges)) {
            if ($isAuthenticatedStore) {
                cancel();
                if (!(await save(true))) {
                    autoSaveErrorModal.showModal();
                } else {
                    to?.url && (await goto(to.url));
                }
            }
        }
    });

    onMount(() => {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
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

    async function callNextUpApi(resourceContentId: string) {
        let nextUpInfo: ResourceContentNextUpInfo | null = null;

        try {
            nextUpInfo = await getFromApi<ResourceContentNextUpInfo>(`/resources/content/${resourceContentId}/next-up`);
        } catch (error) {
            log.exception(error);
        }

        return nextUpInfo;
    }

    async function handleNextUpInfo(nextUpInfo: ResourceContentNextUpInfo | null) {
        if (nextUpInfo === null) {
            return;
        }

        if (nextUpInfo.nextUpResourceContentId) {
            shouldTransition = true;
            await goto(`/resources/${nextUpInfo.nextUpResourceContentId}`);
        } else {
            await goto(`/`);
        }
    }

    async function takeActionAndCallback<T>(action: () => Promise<T>, callback: (response: T) => Promise<void>) {
        $isPageTransacting = true;
        if (get(editableDisplayNameStore.hasChanges) || get(editableContentStore.hasChanges)) {
            await patchData();
        }
        try {
            const response = await action();
            await callback(response);
            $isPageTransacting = false;
        } catch (error) {
            if (isApiErrorWithMessage(error, 'User can only create one translation at a time')) {
                window.location.reload();
            }

            errorModal.showModal();
            $isPageTransacting = false;
            throw error;
        }
    }

    async function takeActionAndRefresh(action: () => Promise<unknown>) {
        // do this for now. eventually we want to have the post return the new state of the resource so we don't need to refresh
        await takeActionAndCallback(action, async () => window.location.reload());
    }

    async function unpublish() {
        await takeActionAndRefresh(() => postToApi(`/resources/content/${resourceContentId}/unpublish`));
    }

    async function sendForManagerReview() {
        const currentResourceContentId = resourceContentId;
        $isPageTransacting = true;

        const nextUpInfo = await callNextUpApi(currentResourceContentId);

        if (currentResourceContentId !== resourceContentId) {
            return;
        }

        await takeActionAndCallback(
            async () =>
                await postToApi<{ assignments: Assignment[] }>(
                    `/resources/content/${currentResourceContentId}/send-for-manager-review`
                ),
            async (response) => {
                if (
                    !nextUpInfo ||
                    response?.assignments.some(
                        (assignment) =>
                            assignment.assignedUserId === $currentUser?.id &&
                            assignment.resourceContentId === parseInt(currentResourceContentId)
                    )
                ) {
                    window?.location?.reload();
                } else {
                    await handleNextUpInfo(nextUpInfo);
                }
            }
        );
    }

    async function sendForPublisherReview() {
        const currentResourceContentId = resourceContentId;
        $isPageTransacting = true;

        const nextUpInfo = await callNextUpApi(currentResourceContentId);

        if (currentResourceContentId !== resourceContentId) {
            return;
        }

        await takeActionAndCallback(
            async () =>
                await postToApi<{ changedByPublisher: boolean }>(
                    `/resources/content/${currentResourceContentId}/send-for-publisher-review`
                ),
            async (response) => {
                if (!nextUpInfo || response?.changedByPublisher) {
                    window?.location?.reload();
                } else {
                    await handleNextUpInfo(nextUpInfo);
                }
            }
        );
    }

    async function assignPublisherReview() {
        await takeActionAndRefresh(() =>
            postToApi(`/resources/content/${resourceContentId}/assign-publisher-review`, {
                assignedUserId: assignToUserId,
            })
        );
    }

    async function aquiferize() {
        await takeActionAndRefresh(() =>
            postToApi(`/resources/content/${resourceContentId}/aquiferize`, {
                assignedUserId: assignToUserId,
            })
        );
    }

    async function publish() {
        $removeAllInlineThreads();
        await takeActionAndRefresh(() =>
            postToApi(`/resources/content/${resourceContentId}/publish`, {
                createDraft: createDraft,
                assignedUserId: assignToUserId,
            })
        );
    }

    async function pullBackToManagerReview() {
        await takeActionAndCallback(
            async () =>
                await postToApi(`/resources/content/${resourceContentId}/assign-editor`, {
                    assignedUserId: $currentUser?.id,
                }),
            async () => {
                window?.location?.reload();
            }
        );
    }

    async function assignUser() {
        const currentResourceContentId = resourceContentId;
        $isPageTransacting = true;

        const nextUpInfo = await callNextUpApi(currentResourceContentId);

        if (currentResourceContentId !== resourceContentId) {
            return;
        }

        await takeActionAndCallback(
            async () =>
                await postToApi(`/resources/content/${currentResourceContentId}/assign-editor`, {
                    assignedUserId: assignToUserId,
                }),
            async () => {
                if (!nextUpInfo) {
                    window?.location?.reload();
                } else {
                    await handleNextUpInfo(nextUpInfo);
                }
            }
        );
    }

    async function createTranslation() {
        await takeActionAndCallback<{ resourceContentId: number } | null>(
            async () =>
                await postToApi<{ resourceContentId: number }>(
                    `/resources/content/${englishContentTranslation?.contentId}/create-translation`,
                    {
                        languageId: newTranslationLanguageId,
                        useDraft: createTranslationFromDraft,
                    }
                ),
            async (response) => await goto(`/resources/${response?.resourceContentId}`)
        );
    }

    async function assignDraftToEditor() {
        await takeActionAndRefresh(
            async () =>
                await postToApi(`/resources/content/${resourceContentId}/assign-editor`, {
                    assignedUserId: assignToUserId,
                })
        );
    }

    function calculateWordCount(wordCounts: number[]) {
        if (wordCounts.length) {
            return wordCounts.reduce((total, current) => total + current, 0);
        }
    }

    async function patchData() {
        const displayName = get(editableDisplayNameStore);
        const content = get(editableContentStore);
        await patchToApi(`/resources/content/${resourceContentId}`, {
            displayName,
            wordCount: calculateWordCount(wordCountsByStep),
            ...(mediaType === MediaTypeEnum.text ? { content: stripOutRtlVerseReferenceMarkers(content) } : null),
        });

        editableDisplayNameStore.setOriginalOnly(displayName);
        editableContentStore.setOriginalOnly(content);
    }

    function usersThatCanBeAssigned() {
        const users = data.users?.filter((u) => u.role !== UserRole.ReportViewer) ?? null;

        if ($userCan(Permission.AssignOutsideCompany)) {
            return users;
        }
        return users?.filter((u) => $userIsInCompany(u.company.id)) ?? null;
    }

    async function handleCommunityTranslate() {
        $isPageTransacting = true;

        newTranslationLanguageId = $currentUser?.languageId ?? null;

        await createTranslation();
    }

    async function handleCommunitySendToPublisher() {
        $isPageTransacting = true;

        await takeActionAndCallback(
            async () => await postToApi(`/resources/content/${resourceContentId}/send-for-publisher-review-community`),
            async () => goto(`/`)
        );
    }
</script>

{#await resourceContentPromise}
    <CenteredSpinnerFullScreen />
{:then resourceContent}
    <div
        on:introend={() => (shouldTransition = false)}
        in:fly={{ x: '100%', duration: shouldTransition ? 450 : 0, delay: shouldTransition ? 350 : 0 }}
        out:fly={{ x: '-100%', duration: shouldTransition ? 450 : 0, delay: shouldTransition ? 250 : 0 }}
        class="px-8 pt-1"
    >
        <div class="flex w-full items-center justify-between border-b-[1px]">
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
                        {#if canAssign || canSendBack}
                            <button
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={openAssignUserModal}
                            >
                                {#if canAssign}
                                    Assign User
                                {:else if canSendBack}
                                    Send Back
                                {/if}
                            </button>
                        {/if}
                        {#if canPullBackToManagerReview}
                            <button
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={pullBackToManagerReview}
                            >
                                Pull Back to Manager Review
                            </button>
                        {/if}
                        {#if canAssignPublisherForReview}
                            <button
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={openAssignReviewModal}
                                >{isInReview ? 'Assign' : 'Review'}
                            </button>
                        {/if}
                        {#if canPublish}
                            <button
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={() => publishOrOpenModal(resourceContent.status)}
                                >Publish
                            </button>
                        {/if}
                        {#if canUnpublish}
                            <button
                                data-app-insights-event-name="resource-unpublish-click"
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={unpublish}
                                >Unpublish
                            </button>
                        {/if}
                        {#if canSendForManagerReview}
                            <button
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={sendForManagerReview}
                                >Send to Review
                            </button>
                        {/if}
                        {#if canSendForPublisherReview}
                            <button
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={sendForPublisherReview}
                                >Send to Publisher
                            </button>
                        {/if}
                        {#if canAquiferize}
                            <button
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={openAquiferizeModal}
                                >{#if isInTranslationWorkflow}
                                    Translate
                                {:else if isNewDraftStatus}
                                    Assign
                                {:else}
                                    Create Draft
                                {/if}</button
                            >
                        {/if}
                        {#if canCommunityTranslate}
                            <button
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={handleCommunityTranslate}
                                >Translate
                            </button>
                        {/if}
                        {#if canCommunitySendToPublisher}
                            <button
                                class="btn btn-primary btn-sm ms-2"
                                disabled={$isPageTransacting}
                                on:click={handleCommunitySendToPublisher}
                                >Send to Publisher
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <ContentArea
            {resourceContent}
            historySidebarOpen={$sidebarContentStore.isOpen}
            sidebarHistoryAvailable={sidebarContentStore.allSnapshotAndPublishedVersionOptions.length > 0}
            onToggleHistoryPane={sidebarContentStore.toggleViewing}
            resourceContentStatuses={data.resourceContentStatuses}
            {commentStores}
            bind:openedSupplementalSideBar
        />

        <div class="flex h-[calc(100vh-170px)]">
            <div
                class="h-full {$sidebarContentStore.animateOpen &&
                    'transition-[width]'} {!$sidebarContentStore.isOpen && !isShowingSupplementalSidebar
                    ? 'w-full'
                    : $sidebarContentStore.isOpen && !isShowingSupplementalSidebar
                    ? 'w-1/2 pe-3'
                    : !$sidebarContentStore.isOpen && isShowingSupplementalSidebar
                    ? 'w-4/5 pe-3'
                    : 'w-2/5 pe-3'}"
            >
                <div class="h-full rounded-md bg-base-200 px-4 pb-0.5 pt-4">
                    <div class="mx-auto flex h-full w-full max-w-4xl flex-col">
                        <div class="flex flex-row items-center">
                            <input
                                bind:value={$editableDisplayNameStore}
                                class="input input-bordered h-8 w-full max-w-[18rem] leading-8"
                                dir="auto"
                                type="text"
                                readonly={!canMakeContentEdits || !resourceContent.isDraft || $isPageTransacting}
                            />
                            {#if resourceContent.isDraft}
                                <div class="grow" />
                                <div class="me-2 font-semibold text-gray-700">Draft</div>
                            {/if}
                        </div>
                        <div class="mt-[0.9375rem] w-full flex-grow">
                            <Content
                                bind:selectedStepNumber
                                {editableDisplayNameStore}
                                {editableContentStore}
                                bind:wordCountsByStep
                                canEdit={canMakeContentEdits && resourceContent.isDraft}
                                canComment={resourceContent.isDraft}
                                {resourceContent}
                                {commentStores}
                                {machineTranslationStore}
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
                class="h-full overflow-hidden {$sidebarContentStore.animateOpen && 'transition-[width]'}
                {!$sidebarContentStore.isOpen ? 'w-0' : isShowingSupplementalSidebar ? 'w-2/5 ps-3' : 'w-1/2 ps-3'}"
            >
                <div class="flex h-full w-full flex-col rounded-md border border-base-300 px-4 pb-1 pt-4">
                    <div class="mx-auto flex h-full w-full max-w-4xl flex-col">
                        <Select
                            value={$sidebarContentStore.selected?.idForSelection ?? null}
                            onChange={sidebarContentStore.selectSnapshotOrVersion}
                            class="select select-bordered select-sm"
                            options={sidebarContentStore.allSnapshotAndPublishedVersionOptions.map((s) => ({
                                value: s.value,
                                label: s.label,
                            }))}
                        />
                        {#if $sidebarContentStore.isOpen}
                            {#if $sidebarContentStore.selected}
                                <div class="my-4 flex h-6 w-full flex-row items-center">
                                    <div class="overflow-hidden text-ellipsis whitespace-nowrap text-lg">
                                        {$sidebarContentStore.selected.displayName}
                                    </div>
                                    <div class="grow"></div>
                                    <div class="text-lg">
                                        <label class="label cursor-pointer py-0">
                                            <input
                                                type="checkbox"
                                                bind:checked={isShowingDiffs}
                                                data-app-insights-event-name="resource-differences-toggled-{isShowingDiffs
                                                    ? 'off'
                                                    : 'on'}"
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
                                    snapshotOrVersion={$sidebarContentStore.selected}
                                    {resourceContent}
                                    {commentStores}
                                    {machineTranslationStore}
                                />
                                {#if mediaType === MediaTypeEnum.text}
                                    <div
                                        class="flex h-10 flex-row items-center justify-between px-3 text-sm text-gray-500"
                                    >
                                        <span>Word count: {$sidebarContentStore.selected.wordCount}</span>
                                        <div class="flex gap-2">
                                            <ScrollSyncLockToggle />
                                        </div>
                                    </div>
                                {/if}
                            {:else if $sidebarContentStore.isLoading}
                                <CenteredSpinner />
                            {:else}
                                Error fetching...
                            {/if}
                        {/if}
                    </div>
                </div>
            </div>

            <div
                class="h-full overflow-hidden transition-[width]
                {isShowingSupplementalSidebar ? 'w-1/5 ps-3' : 'w-0'}"
            >
                <div
                    class="flex h-full w-full flex-col rounded-md border border-base-300 {openedSupplementalSideBar ===
                    OpenedSupplementalSideBar.Comments
                        ? ''
                        : 'hidden'}"
                >
                    <CommentsSidebar {commentStores} />
                </div>
                <div
                    class="flex h-full w-full flex-col rounded-md border border-base-300 {openedSupplementalSideBar ===
                    OpenedSupplementalSideBar.BibleReferences
                        ? ''
                        : 'hidden'}"
                >
                    <BibleReferencesSidebar
                        visible={openedSupplementalSideBar === OpenedSupplementalSideBar.BibleReferences}
                        language={resourceContent.language}
                        references={getSortedReferences(resourceContent)}
                    />
                </div>
            </div>
        </div>
    </div>

    <InlineComment {commentStores} />
    <VersePopout language={resourceContent.language} />
{:catch error}
    <ErrorMessage uncastError={error} />
{/await}

{#key resourceContentId}
    <Modal
        primaryButtonText="Assign"
        primaryButtonOnClick={assignPublisherReview}
        primaryButtonDisabled={!assignToUserId}
        bind:open={isAssignReviewModalOpen}
        header="Choose a Reviewer"
    >
        <UserSelector
            users={data.users?.filter((u) => u.role === UserRole.Publisher) ?? []}
            hideUser={resourceContent?.assignedUser}
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
                        on:click={isInTranslationWorkflow || isNewDraftStatus ? assignDraftToEditor : aquiferize}
                        disabled={assignToUserId === null || $isPageTransacting}>Assign</button
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
            {#if $promptForMachineTranslationRating}
                <div class="mb-8 flex flex-col justify-start gap-4">
                    <div class="font-semibold text-error">Please rate the AI translation before reassigning.</div>
                    <div>
                        <MachineTranslationRating
                            {machineTranslationStore}
                            showingInPrompt={true}
                            improvementHorizontalPositionPx={0}
                        />
                    </div>
                </div>
            {/if}
            <div class="flex flex-col">
                <UserSelector
                    users={usersThatCanBeAssigned()}
                    defaultLabel="Select User"
                    bind:selectedUserId={assignToUserId}
                    hideUser={resourceContent?.assignedUser}
                />
                <div class="flex w-full flex-row space-x-2 pt-4">
                    <div class="flex-grow" />
                    <button
                        class="btn btn-primary"
                        on:click={assignUser}
                        disabled={assignToUserId === null || $isPageTransacting}>Assign</button
                    >
                    <button class="btn btn-outline btn-primary" on:click={() => assignUserModal.close()}>Cancel</button>
                </div>
            </div>
        </div>
    </dialog>

    <dialog bind:this={publishModal} class="modal">
        <div class="modal-box">
            <h3 class="w-full pb-4 text-center text-xl font-bold">
                {hasUnresolvedThreads && resourceContent?.status !== ResourceContentStatusEnum.New
                    ? 'Confirm Publish'
                    : 'Choose Publish Option'}
            </h3>
            <div class="flex flex-col">
                {#if hasUnresolvedThreads && resourceContent?.status !== ResourceContentStatusEnum.New}
                    <p class="py-4 text-lg text-warning">This resource has unresolved comments.</p>
                {/if}
                {#if resourceContent?.status === ResourceContentStatusEnum.New}
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
                    <button class="btn btn-primary" on:click={publish} disabled={$isPageTransacting}>Publish</button>
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
                    existingTranslations={resourceContent?.contentTranslations ?? []}
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
                        disabled={newTranslationLanguageId === null || $isPageTransacting}>Create</button
                    >
                    <button class="btn btn-outline btn-primary" on:click={() => addTranslationModal.close()}
                        >Cancel</button
                    >
                </div>
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
{/key}

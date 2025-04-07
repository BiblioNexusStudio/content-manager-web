<script lang="ts">
    import Tooltip from '$lib/components/Tooltip.svelte';
    import CheckLongIcon from '$lib/icons/CheckLongIcon.svelte';
    import { formatUtcToLocalTimeAndDate } from '$lib/utils/date-time';
    import CommentButton from '$lib/components/comments/CommentButton.svelte';
    import { tick } from 'svelte';
    import type { Comment, CreateThreadResponse } from '$lib/types/comments';
    import { patchToApi, postToApi } from '$lib/utils/http-service';
    import { log } from '$lib/logger';
    import { currentUser } from '$lib/stores/auth';
    import type { CommentStores } from '$lib/stores/comments';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import { onMount } from 'svelte';
    import CommentEditableDiv from './CommentEditableDiv.svelte';
    import { parseCommentDbTextIntoDisplayHtml, parseHtmlIntoCommentDbText } from '../mentions/mentions.svelte';
    import { page } from '$app/state';

    interface Props {
        showParent?: boolean;
        parentDiv?: HTMLDivElement;
        isCommenting: boolean;
        threadId: number;
        componentSource: string;
        commentStores: CommentStores;
    }

    let {
        showParent = $bindable(true),
        parentDiv = undefined,
        isCommenting = $bindable(false),
        threadId = $bindable(),
        componentSource,
        commentStores,
    }: Props = $props();

    const { commentThreads, createNewThread, commentMarks } = commentStores;

    let isSendingComment = $state(false);
    let wasSavingCommentError = $state(false);
    let editingCommentId = $state(0);
    let previousCommentValue = $state('');
    let currentCommentValue = $state('');

    let activeThread = $state($commentThreads?.threads.find((x) => x.id === threadId));
    let isNewThread = $state(threadId === -1);

    const searchParams = searchParameters(
        {
            commentId: ssp.string(''),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    const onReplyClick = async () => {
        isCommenting = true;
        await tick();
        scrollParentDivToBottom();
    };

    const onEditClick = (comment: Comment) => {
        isCommenting = true;
        editingCommentId = comment.id;
        previousCommentValue = comment.comment;
        currentCommentValue = comment.comment;
        activeThread = activeThread;
    };

    const onCancelClick = () => {
        if (isNewThread) {
            showParent = false;
            $createNewThread(false, 0, false);
        }

        resetEditingFields();
    };

    const onResolveClick = async () => {
        const commentMark = $commentMarks.find((x) => x.threadId === threadId);
        if (commentMark) {
            const span = document.getElementById(commentMark.spanId);
            const range = document.createRange();
            // Check the span actually exists in the Tiptap editor. If it doesn't exist it probably means the text
            // containing the comment was already deleted.
            if (span) {
                range.selectNodeContents(span);

                const selection = window.getSelection();
                selection!.removeAllRanges();
                selection!.addRange(range);

                span.scrollIntoView({ behavior: 'smooth', block: 'center' });

                setTimeout(() => {
                    commentMark.editor?.chain().focus().unsetComments().run();
                }, 100);
            }
        }

        resetEditingFields();
        showParent = false;

        try {
            await patchToApi(`/comments/threads/${threadId}/resolve`);
            const threadToResolve = $commentThreads?.threads.find((x) => x.id === threadId);
            if (threadToResolve) {
                threadToResolve.resolved = true;
                $commentThreads = $commentThreads; // Hi, I'm Svelte, and I can't update my derived stores properly.
            }
        } catch (error) {
            // Practically, I don't think the user cares that the PATCH failed, so don't alert them
            log.exception(error);
        }
    };

    const onNewCommentClick = async () => {
        isSendingComment = true;
        let res: CreateThreadResponse | null;

        try {
            if (isNewThread) {
                res = await postToApi<CreateThreadResponse>('/comments/threads', {
                    threadType: 'ResourceContentVersion',
                    typeId: $commentThreads?.threadTypeId,
                    comment: parseHtmlIntoCommentDbText(currentCommentValue, page.data.users),
                });

                $commentThreads?.threads.push({
                    id: res!.threadId,
                    resolved: false,
                    comments: [],
                });
                $commentThreads = $commentThreads;
                threadId = res!.threadId;
                $createNewThread(true, threadId, false);
                showParent = false;

                // await tick() no longer working in this instance after the Svelte 5 upgrade.
                // We have to manually update activeThread.
                activeThread = $commentThreads?.threads.find((x) => x.id === threadId);
            } else {
                res = await postToApi('/comments', {
                    threadId: threadId,
                    comment: parseHtmlIntoCommentDbText(currentCommentValue, page.data.users),
                });
            }

            activeThread?.comments.push({
                id: res!.commentId,
                comment: currentCommentValue,
                user: {
                    id: $currentUser!.id,
                    name: $currentUser!.name,
                },
                dateTime: new Date().toISOString(),
            });

            // force rerender in #each
            activeThread = activeThread;

            scrollParentDivToBottom();
            resetEditingFields();
        } catch (error) {
            $createNewThread(false, threadId ?? -1, true);
            wasSavingCommentError = true;
            isSendingComment = false;
            log.exception(error);
        }
    };

    const onEditCommentClick = async (_: MouseEvent, comment: Comment) => {
        isSendingComment = true;
        try {
            await patchToApi(`/comments/${comment.id}`, {
                comment: parseHtmlIntoCommentDbText(currentCommentValue, page.data.users),
            });

            comment.comment = currentCommentValue;

            // force rerender in #each
            activeThread = activeThread;
            resetEditingFields();
        } catch (error) {
            wasSavingCommentError = true;
            isSendingComment = false;
            log.exception(error);
        }
    };

    const scrollParentDivToBottom = () => {
        if (parentDiv) {
            parentDiv.scrollTo({ top: parentDiv.scrollHeight, behavior: 'smooth' });
        }
    };

    const resetEditingFields = () => {
        isSendingComment = false;
        isCommenting = false;
        currentCommentValue = '';
        previousCommentValue = '';
        editingCommentId = 0;
        $commentThreads = $commentThreads;
    };

    onMount(async () => {
        const element = document.getElementById(`comment-${$searchParams.commentId}`);
        if (element) {
            await tick();
            element.scrollIntoView({ block: 'center' });

            if (parentDiv && parentDiv.querySelector(`#comment-${$searchParams.commentId}`)) {
                parentDiv?.classList.add('border-primary');

                const commentMark = $commentMarks.find((x) => x.threadId === threadId);
                if (commentMark) {
                    const span = document.getElementById(commentMark.spanId);
                    span?.classList.add(...['bg-primary/50', 'border-2', 'border-primary']);
                    span?.classList.remove('bg-primary/20');

                    const observer = new MutationObserver(() => {
                        if (document.body.contains(span)) {
                            span?.scrollIntoView({ block: 'center' });
                            observer.disconnect();
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                }
            }
        }
    });
</script>

{#if activeThread}
    {#each activeThread.comments as comment, i (comment)}
        <div class="mx-2 my-2 flex flex-col" id={`comment-${comment.id}`}>
            <div class="flex place-items-center justify-between">
                <div class="flex flex-col">
                    <div class="font-semibold">{comment.user.name}</div>
                    <div class="text-xs">{formatUtcToLocalTimeAndDate(comment.dateTime)}</div>
                </div>
                {#if i === 0 && !isCommenting && !activeThread.resolved}
                    <Tooltip position={{ right: '2rem' }} text="Mark Resolved and Hide">
                        <button
                            data-app-insights-event-name="{componentSource}-comment-resolve-click"
                            class="text-primary me-1"
                            onclick={onResolveClick}><CheckLongIcon /></button
                        >
                    </Tooltip>
                {/if}
            </div>
            {#if editingCommentId === comment.id}
                <CommentEditableDiv disabled={isSendingComment} bind:value={currentCommentValue}></CommentEditableDiv>
                {#if wasSavingCommentError}
                    <div class="text-error me-4 flex justify-end">Error editing comment.</div>
                {/if}
                <div class="flex justify-end">
                    {#if isSendingComment}
                        <div class="loading loading-dots text-primary my-3 me-4"></div>
                    {:else}
                        <CommentButton buttonProps={{ onclick: onCancelClick }}>Cancel</CommentButton>
                        <CommentButton
                            appInsightsEventName="{componentSource}-comment-save-click"
                            disabled={currentCommentValue === '' || currentCommentValue === previousCommentValue}
                            buttonProps={{ onclick: (e: MouseEvent) => onEditCommentClick(e, comment) }}
                            >Save</CommentButton
                        >
                    {/if}
                </div>
            {:else}
                <div class="mt-2 whitespace-pre-wrap">
                    {@html parseCommentDbTextIntoDisplayHtml(comment.comment, page.data.users)}
                </div>
            {/if}
        </div>
        {#if i !== activeThread.comments.length - 1}
            {#if comment.user.id === $currentUser?.id && !isCommenting && !activeThread.resolved}
                <div class="flex justify-end">
                    <CommentButton
                        appInsightsEventName="{componentSource}-comment-edit-click"
                        buttonProps={{ onclick: () => onEditClick(comment) }}>Edit</CommentButton
                    >
                </div>
            {/if}
            <div class="divider mx-2 my-0"></div>
        {:else if !isCommenting && !activeThread.resolved}
            <div class="flex justify-end">
                {#if comment.user.id === $currentUser?.id}
                    <CommentButton
                        appInsightsEventName="{componentSource}-comment-edit-click"
                        buttonProps={{ onclick: () => onEditClick(comment) }}>Edit</CommentButton
                    >
                {/if}
                <CommentButton
                    appInsightsEventName="{componentSource}-comment-reply-click"
                    buttonProps={{ onclick: onReplyClick }}>Reply</CommentButton
                >
            </div>
        {:else}
            <div class="h-3"></div>
        {/if}
    {/each}
    {#if isCommenting && !editingCommentId}
        <div class="bg-base-100 flex flex-col">
            <div class="mx-2">
                {#if isNewThread}
                    <div class="my-2">Create comment</div>
                {:else}
                    <div class="divider mx-2 my-1"></div>
                {/if}
                <CommentEditableDiv disabled={isSendingComment} bind:value={currentCommentValue}></CommentEditableDiv>
            </div>
            {#if wasSavingCommentError}
                <div class="text-error me-4 flex justify-end">Error saving new comment.</div>
            {/if}
            <div class="flex justify-end">
                {#if isSendingComment}
                    <div class="loading loading-dots text-primary my-3 me-4"></div>
                {:else}
                    <CommentButton buttonProps={{ onclick: onCancelClick }}>Cancel</CommentButton>
                    <CommentButton
                        appInsightsEventName="{componentSource}-comment-create-click"
                        disabled={currentCommentValue === ''}
                        buttonProps={{ onclick: onNewCommentClick }}>Comment</CommentButton
                    >
                {/if}
            </div>
        </div>
    {/if}
{/if}

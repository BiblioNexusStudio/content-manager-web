<script lang="ts">
    import Tooltip from '$lib/components/Tooltip.svelte';
    import CheckLongIcon from '$lib/icons/CheckLongIcon.svelte';
    import { formatUtcToLocalTimeAndDate } from '$lib/utils/date-time';
    import CommentButton from '$lib/components/comments/CommentButton.svelte';
    import CommentTextArea from '$lib/components/comments/CommentTextArea.svelte';
    import { tick } from 'svelte';
    import type { Comment, CreateThreadResponse } from '$lib/types/comments';
    import { patchToApi, postToApi } from '$lib/utils/http-service';
    import { log } from '$lib/logger';
    import { currentUser } from '$lib/stores/auth';
    import type { CommentStores } from '$lib/stores/comments';

    export let showParent = true;
    export let parentDiv: HTMLDivElement | undefined = undefined;
    export let isCommenting = false;
    export let threadId: number;
    export let componentSource: string;

    export let commentStores: CommentStores;
    const { commentThreads, createNewThread, commentMarks } = commentStores;

    let isSendingComment = false;
    let wasSavingCommentError = false;
    let editingCommentId = 0;
    let previousCommentValue = '';
    let currentCommentValue = '';

    $: activeThread = $commentThreads?.threads.find((x) => x.id === threadId);
    $: isNewThread = threadId === -1;

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
                    comment: currentCommentValue,
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

                // Make sure activeThread is refreshed
                await tick();
            } else {
                res = await postToApi('/comments', {
                    threadId: threadId,
                    comment: currentCommentValue,
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
                comment: currentCommentValue,
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
</script>

{#if activeThread}
    {#each activeThread.comments as comment, i (comment)}
        <div class="mx-2 my-2 flex flex-col">
            <div class="flex place-items-center justify-between">
                <div class="flex flex-col">
                    <div class="font-semibold">{comment.user.name}</div>
                    <div class="text-xs">{formatUtcToLocalTimeAndDate(comment.dateTime)}</div>
                </div>
                {#if i === 0 && !isCommenting && !activeThread.resolved}
                    <Tooltip
                        position={{ right: '2rem' }}
                        class="border-primary text-primary"
                        text="Mark Resolved and Hide"
                    >
                        <button
                            data-app-insights-event-name="{componentSource}-comment-resolve-click"
                            class="me-1 text-primary"
                            on:click={onResolveClick}><CheckLongIcon /></button
                        >
                    </Tooltip>
                {/if}
            </div>
            {#if editingCommentId === comment.id}
                <CommentTextArea disabled={isSendingComment} bind:value={currentCommentValue}></CommentTextArea>
                {#if wasSavingCommentError}
                    <div class="me-4 flex justify-end text-error">Error editing comment.</div>
                {/if}
                <div class="flex justify-end">
                    {#if isSendingComment}
                        <div class="loading loading-dots my-3 me-4 text-primary"></div>
                    {:else}
                        <CommentButton on:click={onCancelClick}>Cancel</CommentButton>
                        <CommentButton
                            appInsightsEventName="{componentSource}-comment-save-click"
                            disabled={currentCommentValue === '' || currentCommentValue === previousCommentValue}
                            on:click={(e) => onEditCommentClick(e, comment)}>Save</CommentButton
                        >
                    {/if}
                </div>
            {:else}
                <div class="mt-2 whitespace-pre-wrap">
                    {comment.comment}
                </div>
            {/if}
        </div>
        {#if i !== activeThread.comments.length - 1}
            {#if comment.user.id === $currentUser?.id && !isCommenting && !activeThread.resolved}
                <div class="flex justify-end">
                    <CommentButton
                        appInsightsEventName="{componentSource}-comment-edit-click"
                        on:click={() => onEditClick(comment)}>Edit</CommentButton
                    >
                </div>
            {/if}
            <div class="divider mx-2 my-0"></div>
        {:else if !isCommenting && !activeThread.resolved}
            <div class="flex justify-end">
                {#if comment.user.id === $currentUser?.id}
                    <CommentButton
                        appInsightsEventName="{componentSource}-comment-edit-click"
                        on:click={() => onEditClick(comment)}>Edit</CommentButton
                    >
                {/if}
                <CommentButton appInsightsEventName="{componentSource}-comment-reply-click" on:click={onReplyClick}
                    >Reply</CommentButton
                >
            </div>
        {:else}
            <div class="h-3"></div>
        {/if}
    {/each}
    {#if isCommenting && !editingCommentId}
        <div class="flex flex-col">
            <div class="mx-2">
                {#if isNewThread}
                    <div class="my-2">Create comment</div>
                {:else}
                    <div class="divider mx-2 my-1"></div>
                {/if}
                <CommentTextArea disabled={isSendingComment} bind:value={currentCommentValue}></CommentTextArea>
            </div>
            {#if wasSavingCommentError}
                <div class="me-4 flex justify-end text-error">Error saving new comment.</div>
            {/if}
            <div class="flex justify-end">
                {#if isSendingComment}
                    <div class="loading loading-dots my-3 me-4 text-primary"></div>
                {:else}
                    <CommentButton on:click={onCancelClick}>Cancel</CommentButton>
                    <CommentButton
                        appInsightsEventName="{componentSource}-comment-create-click"
                        disabled={currentCommentValue === ''}
                        on:click={onNewCommentClick}>Comment</CommentButton
                    >
                {/if}
            </div>
        </div>
    {/if}
{/if}

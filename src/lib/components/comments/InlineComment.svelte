<script lang="ts">
    import CheckLongIcon from '$lib/icons/CheckLongIcon.svelte';
    import { onDestroy, onMount, tick } from 'svelte';
    import { currentUser } from '$lib/stores/auth';
    import { formatUtcToLocalTimeAndDate } from '$lib/utils/date-time';
    import { patchToApi, postToApi } from '$lib/utils/http-service';
    import type { CreateThreadResponse, Comment } from '$lib/types/comments';
    import { log } from '$lib/logger';
    import CommentButton from '$lib/components/comments/CommentButton.svelte';
    import CommentTextArea from '$lib/components/comments/CommentTextArea.svelte';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import type { CommentStores } from '$lib/stores/comments';

    export let commentStores: CommentStores;
    const {
        commentThreads,
        activeThreadId,
        activeThread: activeThreadStore,
        createNewThread,
        commentMarks,
    } = commentStores;

    let span: HTMLElement | null;
    let windowInnerWidth = 0;
    let windowInnerHeight = 0;
    let parentDiv: HTMLDivElement | undefined;
    let show = false;
    let isCommenting = false;
    let isSendingComment = false;
    let wasSavingCommentError = false;
    let editingCommentId = 0;
    let previousCommentValue = '';

    $: currentCommentValue = activeThreadId && '';
    $: commentSpanRect = (windowInnerWidth || windowInnerHeight) && span?.getBoundingClientRect();
    $: heightAtBottom = (commentSpanRect && windowInnerHeight - commentSpanRect.bottom - 10) ?? 0;
    $: parentHeight = parentDiv?.getBoundingClientRect()?.height ?? 0;
    $: isNewThread = $activeThreadId === -1;
    $: activeThread = $activeThreadStore;

    onMount(() => {
        window.onInlineCommentClick = async (e: MouseEvent, threadId: number, spanId: string) => {
            if (isCommenting) return;

            wasSavingCommentError = false;
            span = document.getElementById(spanId);
            $activeThreadId = threadId;

            show = true;

            // isNewThread isn't refreshed yet
            if ($activeThreadId === -1) {
                isCommenting = true;
            }

            e.stopPropagation();
        };
    });

    onDestroy(() => {
        document.removeEventListener('click', onAnyClick);
        window.onInlineCommentClick = undefined;
    });

    const scrollParentDivToBottom = () => {
        if (parentDiv) {
            parentDiv.scrollTop = parentDiv.scrollHeight;
        }
    };

    const onReplyClick = async (e: MouseEvent) => {
        e.stopPropagation();
        isCommenting = true;
        await tick();
        scrollParentDivToBottom();
    };

    const onEditClick = async (e: MouseEvent, comment: Comment) => {
        e.stopPropagation();
        isCommenting = true;
        editingCommentId = comment.id;
        previousCommentValue = comment.comment;
        currentCommentValue = comment.comment;
        activeThread = activeThread;
        parentHeight = 0;
    };

    const onCancelClick = (e: MouseEvent) => {
        e.stopPropagation();

        if (isNewThread) {
            show = false;
            $createNewThread(false, 0, false);
        }

        resetEditingFields();
    };

    const onResolveClick = async (e: MouseEvent) => {
        e.stopPropagation();
        if ($activeThreadId) {
            const commentMark = $commentMarks.find((x) => x.threadId === $activeThreadId);
            if (commentMark) {
                commentMark.editor?.chain().focus().unsetComments().run();
            }

            resetEditingFields();
            show = false;

            try {
                await patchToApi(`/comments/threads/${$activeThreadId}/resolve`);
                const threadToResolve = $commentThreads?.threads.find((x) => x.id === $activeThreadId);
                if (threadToResolve) {
                    threadToResolve.resolved = true;
                    $commentThreads = $commentThreads; // Hi, I'm Svelte, and I can't update my derived stores properly.
                }
            } catch (error) {
                // Practically, I don't think the user cares that the PATCH failed, so don't alert them
                log.exception(error);
            }
        }
    };

    const onNewCommentClick = async (e: MouseEvent) => {
        e.stopPropagation();

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
                $activeThreadId = res!.threadId;
                $createNewThread(true, $activeThreadId, false);
                show = false;

                // Make sure activeThreadStore is refreshed
                await tick();
            } else {
                res = await postToApi('/comments', {
                    threadId: $activeThreadId,
                    comment: currentCommentValue,
                });
            }

            $activeThreadStore?.comments.push({
                id: res!.commentId,
                comment: currentCommentValue,
                user: {
                    id: $currentUser!.id,
                    name: $currentUser!.name,
                },
                dateTime: new Date().toISOString(),
            });

            // force rerender in #each
            activeThread = $activeThreadStore;

            scrollParentDivToBottom();
        } catch (error) {
            $createNewThread(false, $activeThreadId ?? -1, true);
            wasSavingCommentError = true;
            log.exception(error);
        } finally {
            resetEditingFields();
        }
    };

    const onEditCommentClick = async (e: MouseEvent, comment: Comment) => {
        e.stopPropagation();

        isSendingComment = true;
        try {
            await patchToApi(`/comments/${comment.id}`, {
                comment: currentCommentValue,
            });

            comment.comment = currentCommentValue;

            // force rerender in #each
            activeThread = $activeThreadStore;
        } catch (error) {
            wasSavingCommentError = true;
            log.exception(error);
        } finally {
            resetEditingFields();
        }
    };

    const onAnyClick = (e: MouseEvent) => {
        if (!parentDiv) return;

        show = parentDiv.contains(e.target as Node) || isCommenting;
    };

    const resetEditingFields = () => {
        isSendingComment = false;
        isCommenting = false;
        currentCommentValue = '';
        previousCommentValue = '';
        editingCommentId = 0;
        parentHeight = 0;
    };
</script>

<svelte:window bind:innerWidth={windowInnerWidth} bind:innerHeight={windowInnerHeight} on:click={onAnyClick} />

{#if show && commentSpanRect && activeThread}
    {#key parentHeight}
        <div
            bind:this={parentDiv}
            class="absolute z-50 flex w-[300px] flex-col overflow-y-auto rounded-lg border-2 bg-white shadow"
            style="left: {commentSpanRect.left -
                (commentSpanRect.left + 300 > windowInnerWidth ? 300 - commentSpanRect.width : 0)}px; {heightAtBottom <
            300
                ? `top:${commentSpanRect.top - parentHeight - 5}px; max-height:400px;`
                : `top:${commentSpanRect.bottom}px; max-height:${heightAtBottom}px;`}"
        >
            {#each activeThread.comments as comment, i (comment)}
                <div class="mx-2 my-2 flex flex-col">
                    <div class="flex place-items-center justify-between">
                        <div class="flex flex-col">
                            <div class="font-semibold">{comment.user.name}</div>
                            <div class="text-xs">{formatUtcToLocalTimeAndDate(comment.dateTime)}</div>
                        </div>
                        {#if i === 0 && !isCommenting}
                            <Tooltip
                                position={{ right: '2rem' }}
                                class="border-primary text-primary"
                                text="Mark Resolved and Hide"
                            >
                                <button class="me-1 text-primary" on:click={onResolveClick}><CheckLongIcon /></button>
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
                                    disabled={currentCommentValue === '' ||
                                        currentCommentValue === previousCommentValue}
                                    on:click={(e) => onEditCommentClick(e, comment)}>Save</CommentButton
                                >
                            {/if}
                        </div>
                    {:else}
                        <div class="mt-2">
                            {comment.comment}
                        </div>
                    {/if}
                </div>
                {#if i !== activeThread.comments.length - 1}
                    {#if comment.user.id === $currentUser?.id && !isCommenting}
                        <div class="flex justify-end">
                            <CommentButton on:click={(e) => onEditClick(e, comment)}>Edit</CommentButton>
                        </div>
                    {/if}
                    <div class="divider mx-2 my-0" />
                {:else if !isCommenting}
                    <div class="flex justify-end">
                        {#if comment.user.id === $currentUser?.id}
                            <CommentButton on:click={(e) => onEditClick(e, comment)}>Edit</CommentButton>
                        {/if}
                        <CommentButton on:click={onReplyClick}>Reply</CommentButton>
                    </div>
                {:else}
                    <div class="h-3" />
                {/if}
            {/each}
            {#if isCommenting && !editingCommentId}
                <div class="flex flex-col">
                    <div class="mx-2">
                        {#if isNewThread}
                            <div class="my-2">Create comment</div>
                        {:else}
                            <div class="divider mx-2 my-1" />
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
                            <CommentButton disabled={currentCommentValue === ''} on:click={onNewCommentClick}
                                >Comment</CommentButton
                            >
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/key}
{/if}

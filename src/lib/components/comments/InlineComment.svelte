<script lang="ts">
    import CheckLongIcon from '$lib/icons/CheckLongIcon.svelte';
    import { onDestroy, onMount, tick } from 'svelte';
    import {
        commentThreads,
        activeThreadId,
        activeThread as activeThreadStore,
        createNewThreadCallback,
        commentMarks,
    } from '$lib/stores/comments';
    import { currentUser } from '$lib/stores/auth';
    import { formatUtcToLocalTimeAndDate } from '$lib/utils/date-time';
    import { patchToApi, postToApi } from '$lib/utils/http-service';
    import type { CreateThreadResponse, Comment } from '$lib/types/comments';
    import { log } from '$lib/logger';
    import CommentButton from '$lib/components/comments/CommentButton.svelte';
    import CommentTextArea from '$lib/components/comments/CommentTextArea.svelte';
    import Tooltip from '$lib/components/Tooltip.svelte';

    let span: HTMLElement | null;
    let focusTextArea: () => void;
    let windowInnerWidth = 0;
    let windowInnerHeight = 0;
    let parentDiv: HTMLDivElement | undefined;
    let show = false;
    let isCommenting = false;
    let isSendingComment = false;
    let wasSavingCommentError = false;
    let editingCommentId = 0;

    $: currentCommentValue = activeThreadId && '';
    $: commentSpanRect = (windowInnerWidth || windowInnerHeight) && span?.getBoundingClientRect();
    $: heightAtBottom = (commentSpanRect && windowInnerHeight - commentSpanRect.bottom - 10) ?? 0;
    $: isNewThread = $activeThreadId === -1;
    $: activeThread = $activeThreadStore;
    $: console.log($commentMarks);

    onMount(() => {
        document.addEventListener('click', onAnyClick);

        window.onInlineCommentClick = async (e: MouseEvent, threadId: number, spanId: string) => {
            if (isCommenting) return;

            wasSavingCommentError = false;
            span = document.getElementById(spanId);
            $activeThreadId = threadId;

            show = true;

            // isNewThread isn't refreshed yet
            if ($activeThreadId === -1) {
                isCommenting = true;

                // Need to come back to this. Something else seems to steal focus, await tick() doesn't work
                setTimeout(focusTextArea, 50);
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
        focusTextArea();
    };

    const onEditClick = async (e: MouseEvent, comment: Comment) => {
        e.stopPropagation();
        isCommenting = true;
        editingCommentId = comment.id;
        currentCommentValue = comment.comment;
        activeThread = activeThread;
        await tick();
        focusTextArea();
    };

    const onCancelClick = (e: MouseEvent) => {
        e.stopPropagation();

        if (isNewThread) {
            show = false;
            $createNewThreadCallback(false, 0, false);
        }

        resetFields();
    };

    const onResolveClick = async (e: MouseEvent) => {
        e.stopPropagation();
        if ($activeThreadId) {
            try {
                await patchToApi(`/comments/threads/${$activeThreadId}/resolve`);
            } catch (error) {
                // Practically, I don't think the user cares that the PATCH failed, so don't alert them
                log.exception(error);
            }

            console.log($commentMarks);
            const commentMark = $commentMarks.filter((x) => x.threadId === $activeThreadId);
            if (commentMark.length > 0) {
                commentMark[0]?.editor?.chain().focus().unsetComments().run();
            }

            resetFields();
            show = false;
        }
    };

    const onCommentClick = async (e: MouseEvent) => {
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

                console.log(res);

                if (!res) {
                    $createNewThreadCallback(false, $activeThreadId ?? -1, true);
                    wasSavingCommentError = true;
                    log.exception(new Error('Comment thread failed to create'));
                    return;
                }

                $commentThreads?.threads.push({
                    id: res.threadId,
                    resolved: false,
                    comments: [],
                });
                $activeThreadId = res.threadId;
                $createNewThreadCallback(true, $activeThreadId, false);
                show = false;

                // Make sure activeThreadStore is refreshed
                await tick();
            } else {
                res = await postToApi('/comments', {
                    threadId: $activeThreadId,
                    comment: currentCommentValue,
                });

                if (!res) {
                    wasSavingCommentError = true;
                    log.exception(new Error('Comment failed to create'));
                    return;
                }
            }

            $activeThreadStore?.comments.push({
                id: res.commentId,
                comment: currentCommentValue,
                user: {
                    id: $currentUser!.id,
                    name: $currentUser!.name,
                },
                dateTime: new Date().toISOString(),
            });

            console.log($activeThreadStore);

            // force rerender in #each
            activeThread = $activeThreadStore;
            console.log(activeThread);

            scrollParentDivToBottom();
        } catch (error) {
            $createNewThreadCallback(false, $activeThreadId ?? -1, true);
            wasSavingCommentError = true;
            log.exception(error);
        } finally {
            resetFields();
        }
    };

    const onEditCommentClick = async (e: MouseEvent, comment: Comment) => {
        e.stopPropagation();

        console.log(currentCommentValue);

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
            resetFields();
        }
    };

    const onAnyClick = (e: MouseEvent) => {
        if (!parentDiv) return;

        show = parentDiv.contains(e.target as Node) || isCommenting;
    };

    const resetFields = () => {
        isSendingComment = false;
        isCommenting = false;
        currentCommentValue = '';
        editingCommentId = 0;
    };
</script>

<svelte:window bind:innerWidth={windowInnerWidth} bind:innerHeight={windowInnerHeight} />

{#if show && commentSpanRect && activeThread}
    <div
        bind:this={parentDiv}
        class="absolute z-50 flex w-[300px] flex-col overflow-y-auto rounded-lg border-2 bg-white shadow"
        style="left: {commentSpanRect.left -
            (commentSpanRect.left + 300 > windowInnerWidth ? 300 - commentSpanRect.width : 0)}px; {heightAtBottom < 300
            ? `top:${commentSpanRect.top - 405}px; max-height:400px;`
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
                        <Tooltip position={{ right: '2rem' }} class="border-primary text-primary" text="Resolve Thread">
                            <button class="me-1 text-primary" on:click={onResolveClick}><CheckLongIcon /></button>
                        </Tooltip>
                    {/if}
                </div>
                {#if editingCommentId === comment.id}
                    <CommentTextArea
                        bind:focus={focusTextArea}
                        disabled={isSendingComment}
                        bind:value={currentCommentValue}
                    ></CommentTextArea>
                    {#if wasSavingCommentError}
                        <div class="me-4 flex justify-end text-error">Error editing comment.</div>
                    {/if}
                    <div class="flex justify-end">
                        {#if isSendingComment}
                            <div class="loading loading-dots my-3 me-4 text-primary"></div>
                        {:else}
                            <CommentButton on:click={onCancelClick}>Cancel</CommentButton>
                            <CommentButton on:click={(e) => onEditCommentClick(e, comment)}>Save</CommentButton>
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
                    <CommentTextArea
                        bind:focus={focusTextArea}
                        disabled={isSendingComment}
                        bind:value={currentCommentValue}
                    ></CommentTextArea>
                </div>
                {#if wasSavingCommentError}
                    <div class="me-4 flex justify-end text-error">Error saving new comment.</div>
                {/if}
                <div class="flex justify-end">
                    {#if isSendingComment}
                        <div class="loading loading-dots my-3 me-4 text-primary"></div>
                    {:else}
                        <CommentButton on:click={onCancelClick}>Cancel</CommentButton>
                        <CommentButton on:click={onCommentClick}>Comment</CommentButton>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
{/if}

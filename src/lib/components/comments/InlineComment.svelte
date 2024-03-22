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
    import type { CreateThreadResponse } from '$lib/types/comments';
    import { log } from '$lib/logger';

    let span: HTMLElement | null;
    let commentTextArea: HTMLTextAreaElement | null;
    let windowInnerWidth = 0;
    let windowInnerHeight = 0;
    let parentDiv: HTMLDivElement | undefined;
    let show = false;
    let isCommenting = false;
    let isSendingComment = false;
    let wasSavingCommentError = false;

    $: currentCommentValue = activeThreadId && '';
    $: commentSpanRect = (windowInnerWidth || windowInnerHeight) && span?.getBoundingClientRect();
    $: heightAtBottom = (commentSpanRect && windowInnerHeight - commentSpanRect.bottom - 10) ?? 0;
    $: isNewThread = $activeThreadId === -1;
    $: activeThread = $activeThreadStore;

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
                setTimeout(() => commentTextArea?.focus(), 50);
            }

            e.stopPropagation();
        };
    });

    onDestroy(() => {
        document.removeEventListener('click', onAnyClick);
        window.onInlineCommentClick = undefined;
        $commentMarks = [];
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
        commentTextArea?.focus();
    };

    const onCancelClick = (e: MouseEvent) => {
        e.stopPropagation();

        if (isNewThread) {
            show = false;
            $createNewThreadCallback(false, 0, false);
        }

        currentCommentValue = '';
        isCommenting = false;
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

            currentCommentValue = '';
            isCommenting = false;
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

            isSendingComment = false;
            isCommenting = false;
            currentCommentValue = '';
            scrollParentDivToBottom();
        } catch (error) {
            $createNewThreadCallback(false, $activeThreadId ?? -1, true);
            wasSavingCommentError = true;
            log.exception(error);
        } finally {
            isSendingComment = false;
        }
    };

    const onAnyClick = (e: MouseEvent) => {
        if (!parentDiv) return;

        show = parentDiv.contains(e.target as Node) || isCommenting;
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
                    {#if i === 0}
                        <div class="me-1 text-primary">
                            <button on:click={onResolveClick}><CheckLongIcon /></button>
                        </div>
                    {/if}
                </div>
                <div class="mt-2">
                    {comment.comment}
                </div>
            </div>
            {#if i !== activeThread.comments.length - 1}
                {#if comment.user.id === $currentUser?.id}
                    <div class="flex justify-end">
                        <button class="btn btn-link text-primary !no-underline">Edit</button>
                    </div>
                {/if}
                <div class="divider mx-2 my-0" />
            {:else}
                <div class="flex justify-end">
                    <button class="btn btn-link text-primary !no-underline">Edit</button>
                    <button class="btn btn-link text-primary !no-underline" on:click={onReplyClick}>Reply</button>
                </div>
            {/if}
        {/each}
        {#if isCommenting}
            <div class="flex flex-col">
                <div class="mx-2">
                    {#if isNewThread}
                        <div class="my-2">Create comment</div>
                    {:else}
                        <div class="divider mx-2 my-1" />
                    {/if}
                    <textarea
                        bind:this={commentTextArea}
                        bind:value={currentCommentValue}
                        disabled={isSendingComment}
                        class="textarea textarea-bordered my-2 w-full resize-none shadow"
                    ></textarea>
                </div>
                {#if wasSavingCommentError}
                    <div class="me-4 flex justify-end text-error">Error saving new comment.</div>
                {/if}
                <div class="flex justify-end">
                    {#if isSendingComment}
                        <div class="loading loading-dots my-3 me-4 text-primary"></div>
                    {:else}
                        <button class="btn btn-link text-primary !no-underline" on:click={onCancelClick}>Cancel</button>
                        <button class="btn btn-link text-primary !no-underline" on:click={onCommentClick}
                            >Comment</button
                        >
                    {/if}
                </div>
            </div>
        {/if}
    </div>
{/if}

<script lang="ts">
    import CheckLongIcon from '$lib/icons/CheckLongIcon.svelte';
    import { onDestroy, onMount, tick } from 'svelte';
    import {
        activeThreadId,
        activeThread as activeThreadStore,
        createNewThreadCallback,
        removeCommentMarks,
    } from '$lib/stores/comments';
    import { currentUser } from '$lib/stores/auth';
    import { formatUtcToLocalTimeAndDate } from '$lib/utils/date-time';

    let span: HTMLElement | null;
    let windowInnerWidth = 0;
    let windowInnerHeight = 0;
    let parentDiv: HTMLDivElement | undefined;
    let show = false;
    let isCommenting = false;
    let isSendingComment = false;

    $: currentCommentValue = activeThreadId && '';
    $: commentSpanRect = (windowInnerWidth || windowInnerHeight) && span?.getBoundingClientRect();
    $: heightAtBottom = (commentSpanRect && windowInnerHeight - commentSpanRect.bottom - 10) ?? 0;
    $: isNewThread = $activeThreadId === -1;
    $: activeThread = $activeThreadStore;

    onMount(() => {
        document.addEventListener('click', onAnyClick);

        window.onInlineCommentClick = (e: MouseEvent, threadId: number, spanId: string) => {
            if (isCommenting) return;

            span = document.getElementById(spanId);
            $activeThreadId = threadId;

            // isNewThread isn't refreshed yet
            if ($activeThreadId === -1) isCommenting = true;

            show = true;
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

    const onCancelClick = (e: MouseEvent) => {
        e.stopPropagation();

        if (isNewThread) {
            show = false;
            $createNewThreadCallback(false, 0);
        }

        isCommenting = false;
    };

    const onResolveClick = (e: MouseEvent) => {
        e.stopPropagation();
        if ($activeThreadId) {
            $removeCommentMarks($activeThreadId);
        }
    };

    const onCommentClick = async (e: MouseEvent) => {
        e.stopPropagation();

        isSendingComment = true;

        if (isNewThread) {
            // get new threadId
            $activeThreadId = 2;
            $createNewThreadCallback(true, $activeThreadId);
            await tick();
        }

        setTimeout(() => {
            $activeThreadStore?.comments.push({
                id: 0,
                comment: currentCommentValue,
                user: {
                    id: $currentUser!.id,
                    name: $currentUser!.name,
                },
                dateTime: new Date().toISOString(),
            });
            // force rerender in #each
            activeThread = $activeThreadStore;

            isSendingComment = false;
            isCommenting = false;
            show = !isNewThread;
            currentCommentValue = '';
            scrollParentDivToBottom();
        }, 2000);
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
        class="absolute z-50 flex w-[300px] flex-col overflow-y-scroll rounded-lg border-2 bg-white shadow"
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
                <div class="divider mx-2" />
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
                        bind:value={currentCommentValue}
                        disabled={isSendingComment}
                        class="textarea textarea-bordered my-2 w-full resize-none shadow"
                    ></textarea>
                </div>
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

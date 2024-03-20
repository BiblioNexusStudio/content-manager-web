<script lang="ts">
    import CheckLongIcon from '$lib/icons/CheckLongIcon.svelte';
    import { onDestroy, onMount } from 'svelte';
    import { activeThreadId, activeThread, createNewThreadCallback } from '$lib/stores/comments';

    let span: HTMLElement | null;
    let windowInnerWidth = 0;
    let windowInnerHeight = 0;
    let parentDiv: HTMLDivElement | undefined;
    let show = false;
    let isReplying = false;

    $: currentCommentValue = activeThreadId && '';
    $: rect = (windowInnerWidth || windowInnerHeight) && span?.getBoundingClientRect();
    $: isNewThread = $activeThreadId === -1;

    onMount(() => {
        document.addEventListener('click', onAnyClick);

        window.onInlineCommentClick = (e: MouseEvent, threadId: number, spanId: string) => {
            if (isReplying) return;

            span = document.getElementById(spanId);
            $activeThreadId = threadId;

            // isNewThread isn't refreshed yet
            if ($activeThreadId === -1) isReplying = true;

            show = true;
            e.stopPropagation();
        };
    });

    onDestroy(() => {
        document.removeEventListener('click', onAnyClick);
        window.onInlineCommentClick = undefined;
    });

    const onReplyClick = (e: MouseEvent) => {
        isReplying = true;
        e.stopPropagation();
    };

    const onCancelClick = (e: MouseEvent) => {
        if (isNewThread) {
            show = false;
            $createNewThreadCallback(false);
        }

        isReplying = false;

        e.stopPropagation();
    };

    const onCommentClick = (e: MouseEvent) => {
        isReplying = false;
        $createNewThreadCallback(true);
        e.stopPropagation();
    };

    const onAnyClick = (e: MouseEvent) => {
        console.log('anyClick fired');
        if (!parentDiv) return;

        show = parentDiv.contains(e.target as Node) || isReplying;
    };
</script>

<svelte:window bind:innerWidth={windowInnerWidth} bind:innerHeight={windowInnerHeight} />

{#if show && rect && $activeThread}
    <div
        bind:this={parentDiv}
        class="absolute z-50 flex w-[300px] flex-col overflow-y-scroll rounded-lg border-2 bg-white shadow"
        style="left: {rect.left}px; top:{rect.bottom}px; max-height: {innerHeight - rect.bottom - 10}px;"
    >
        {#each $activeThread.comments as comment, i (i)}
            <div class="mx-2 my-2 flex flex-col">
                <div class="flex place-items-center justify-between">
                    <div class="flex flex-col">
                        <div class="font-semibold">{comment.name}</div>
                        <div class="text-xs">{comment.time}</div>
                    </div>
                    {#if i === 0}
                        <div class="text-primary"><CheckLongIcon /></div>
                    {/if}
                </div>
                <div class="mt-2">
                    {comment.comment}
                </div>
            </div>
            {#if i !== $activeThread.comments.length - 1}
                <div class="divider mx-2 my-1" />
            {/if}
        {/each}
        {#if isReplying}
            <div class="flex flex-col">
                <div class="mx-2">
                    {#if isNewThread}
                        <div class="my-2">Create comment</div>
                    {:else}
                        <div class="divider mx-2 my-1" />
                    {/if}
                    <textarea
                        bind:value={currentCommentValue}
                        class="textarea textarea-bordered my-2 w-full resize-none shadow"
                    ></textarea>
                </div>
                <div class="flex justify-end">
                    <button class="btn btn-link text-primary !no-underline" on:click={onCancelClick}>Cancel</button>
                    <button class="btn btn-link text-primary !no-underline" on:click={onCommentClick}>Comment</button>
                </div>
            </div>
        {:else}
            <div class="flex justify-end">
                <button class="btn btn-link text-primary !no-underline" on:click={onReplyClick}>Reply</button>
            </div>
        {/if}
    </div>
{/if}

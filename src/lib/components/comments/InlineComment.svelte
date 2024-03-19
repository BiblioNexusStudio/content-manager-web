<script lang="ts">
    import CheckLongIcon from '$lib/icons/CheckLongIcon.svelte';
    import { onDestroy, onMount } from 'svelte';

    let span: HTMLElement | null;
    export let threads: { threadId: number; comments: { name: string; time: string; comment: string }[] }[] = [];
    let activeThreadId = 0;

    let windowInnerWidth = 0;
    let windowInnerHeight = 0;
    let parentDiv: HTMLDivElement | undefined;
    let show = false;
    let isReplying = false;

    $: activeThread = threads.find((x) => x.threadId === activeThreadId);
    $: rect = (windowInnerWidth || windowInnerHeight) && span?.getBoundingClientRect();

    onMount(() => {
        document.addEventListener('click', onAnyClick);

        window.onInlineCommentClick = (threadId: number, spanId: string) => {
            if (isReplying) return;

            span = document.getElementById(spanId);
            activeThreadId = threadId;
            console.log('inline comment click');

            show = true;
        };
    });

    onDestroy(() => {
        document.removeEventListener('click', onAnyClick);
        window.onInlineCommentClick = undefined;
    });

    const onReplyClick = () => {
        isReplying = true;
    };

    const onCancelClick = () => {
        isReplying = false;
    };

    const onCommentClick = () => {
        isReplying = false;
    };

    const onAnyClick = (e: MouseEvent) => {
        console.log('anyClick fired');
        if (!parentDiv) return;

        show = parentDiv.contains(e.target as Node) || span?.contains(e.target as Node) || isReplying;
    };
</script>

<svelte:window bind:innerWidth={windowInnerWidth} bind:innerHeight={windowInnerHeight} />

{#if show && rect && activeThread}
    <div
        bind:this={parentDiv}
        class="absolute z-50 flex w-[300px] flex-col overflow-y-scroll rounded-lg border-2 bg-white"
        style="left: {rect.left}px; top:{rect.bottom}px; max-height: {innerHeight - rect.bottom - 10}px;"
    >
        {#each activeThread.comments as comment, i (i)}
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
            {#if i !== activeThread.comments.length - 1}
                <div class="divider mx-2 my-1" />
            {/if}
        {/each}
        {#if isReplying}
            <div class="flex flex-col">
                <div class="mx-2"><textarea class="textarea textarea-bordered w-full resize-none"></textarea></div>
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

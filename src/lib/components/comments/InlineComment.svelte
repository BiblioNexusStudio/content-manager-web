<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type { CommentStores } from '$lib/stores/comments';
    import CommentThread from '$lib/components/comments/CommentThread.svelte';

    export let commentStores: CommentStores;

    const { sidebarParentDivs } = commentStores;

    let span: HTMLElement | null;
    let windowInnerWidth = 0;
    let windowInnerHeight = 0;
    let parentDiv: HTMLDivElement | undefined;
    let show = false;
    let isCommenting: boolean;
    let threadId: number;
    let bubblingClick = false;

    $: commentSpanRect = (windowInnerWidth || windowInnerHeight) && span?.getBoundingClientRect();
    $: heightAtBottom = (commentSpanRect && windowInnerHeight - commentSpanRect.bottom - 10) ?? 0;
    $: parentHeight = parentDiv?.getBoundingClientRect()?.height ?? 0;

    onMount(() => {
        window.onInlineCommentClick = async (e: MouseEvent, selectedThreadId: number, spanId: string) => {
            if (isCommenting) return;

            span = document.getElementById(spanId);
            threadId = selectedThreadId;

            show = true;
            if (threadId === -1) {
                isCommenting = true;
            }

            const sidebarDiv = $sidebarParentDivs.find((x) => x.threadId === threadId);
            if (sidebarDiv) {
                sidebarDiv.click();
            }

            bubblingClick = true;
        };
    });

    onDestroy(() => {
        document.removeEventListener('click', onAnyClick);
        window.onInlineCommentClick = undefined;
    });

    const onAnyClick = (e: MouseEvent) => {
        if (bubblingClick) {
            bubblingClick = false;
            return;
        }

        if (!parentDiv) return;

        show = parentDiv.contains(e.target as Node) || isCommenting;
    };
</script>

<svelte:window bind:innerWidth={windowInnerWidth} bind:innerHeight={windowInnerHeight} on:click={onAnyClick} />

{#if show && commentSpanRect}
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
            <CommentThread
                {commentStores}
                {parentDiv}
                bind:isCommenting
                bind:showParent={show}
                bind:parentHeight
                bind:threadId
            />
        </div>
    {/key}
{/if}

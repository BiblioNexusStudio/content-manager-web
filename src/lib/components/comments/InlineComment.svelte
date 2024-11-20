<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type { CommentStores } from '$lib/stores/comments';
    import CommentThread from '$lib/components/comments/CommentThread.svelte';
    import MarkPopout from '$lib/components/editorMarkPopouts/MarkPopout.svelte';

    export let commentStores: CommentStores;

    const { sidebarParentDivs } = commentStores;

    let markSpan: HTMLElement | null;
    let container: HTMLDivElement | undefined;
    let show = false;
    let isCommenting: boolean;
    let threadId: number;
    let bubblingClick = false;

    onMount(() => {
        window.onInlineCommentClick = onInlineCommentClick;
    });

    function onInlineCommentClick(selectedThreadId: number, spanId: string) {
        if (isCommenting) return;

        markSpan = document.getElementById(spanId);
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
    }

    onDestroy(() => {
        document.removeEventListener('click', onAnyClick);
        if (window.onInlineCommentClick === onInlineCommentClick) {
            window.onInlineCommentClick = undefined;
        }
    });

    const onAnyClick = (e: MouseEvent) => {
        if (bubblingClick) {
            bubblingClick = false;
            return;
        }

        if (!container) return;

        show = container.contains(e.target as Node) || isCommenting;
    };
</script>

<svelte:window on:click={onAnyClick} />

<MarkPopout bind:show bind:container bind:markSpan>
    <CommentThread
        componentSource="inline"
        {commentStores}
        parentDiv={container}
        bind:isCommenting
        bind:showParent={show}
        bind:threadId
    />
</MarkPopout>

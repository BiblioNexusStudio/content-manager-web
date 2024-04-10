<script lang="ts">
    import CommentThread from '$lib/components/comments/CommentThread.svelte';
    import type { CommentThread as CommentThreadType } from '$lib/types/comments';
    import type { CommentStores } from '$lib/stores/comments';
    import { onMount } from 'svelte';

    export let commentStores: CommentStores;
    export let thread: CommentThreadType;

    const { commentMarks, sidebarParentDivs } = commentStores;
    const borderClass = 'border-primary';
    const normalSpanBackgroundColorClass = 'bg-primary/20';
    const selectedSpanBackgroundColorClass = ['bg-primary/50', 'border-2', borderClass];

    let parentDiv: HTMLDivElement;
    let bubbledClick = false;

    onMount(() => {
        const existing = $sidebarParentDivs.find((x) => x.threadId === thread.id);
        if (existing) {
            existing.div = parentDiv;
            existing.click = () => focusParent(true);
        } else {
            $sidebarParentDivs.push({ threadId: thread.id, div: parentDiv, click: () => focusParent(true) });
        }
    });

    const focusParent = (fromInlineClick: boolean) => {
        bubbledClick = true;
        parentDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        for (let i = 0; i < $sidebarParentDivs.length; i++) {
            const currentParentDiv = $sidebarParentDivs[i]?.div;
            if (!thread.resolved && currentParentDiv === parentDiv) {
                parentDiv.classList.add(borderClass);
                highlightCommentSpan(fromInlineClick);
            } else {
                currentParentDiv?.classList.remove(borderClass);
            }
        }
    };

    const highlightCommentSpan = (fromInlineClick: boolean) => {
        const commentMark = $commentMarks.find((x) => x.threadId === thread.id);
        if (commentMark) {
            const span = document.getElementById(commentMark.spanId) as HTMLSpanElement;
            span.classList.add(...selectedSpanBackgroundColorClass);
            span.classList.remove(normalSpanBackgroundColorClass);

            if (!fromInlineClick) {
                span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const onAnyClick = () => {
        if (bubbledClick) {
            bubbledClick = false;
            return;
        }

        if (parentDiv) {
            parentDiv.classList.remove(borderClass);
        }

        const commentMark = $commentMarks.find((x) => x.threadId === thread.id);
        if (commentMark) {
            const span = document.getElementById(commentMark.spanId) as HTMLSpanElement;
            span.classList.add(normalSpanBackgroundColorClass);
            span.classList.remove(...selectedSpanBackgroundColorClass);
        }
    };
</script>

<svelte:window on:click={onAnyClick} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    bind:this={parentDiv}
    class="rounded-md border-2 {thread.resolved && 'bg-gray-100'}"
    on:click={() => focusParent(false)}
>
    <CommentThread {commentStores} threadId={thread.id} />
</div>

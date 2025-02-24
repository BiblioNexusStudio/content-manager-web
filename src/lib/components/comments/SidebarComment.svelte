<script lang="ts">
    import CommentThread from '$lib/components/comments/CommentThread.svelte';
    import type { CommentThread as CommentThreadType } from '$lib/types/comments';
    import type { CommentStores } from '$lib/stores/comments';
    import { onMount } from 'svelte';

    interface Props {
        commentStores: CommentStores;
        thread: CommentThreadType;
    }

    let { commentStores, thread }: Props = $props();

    const { commentMarks, sidebarParentDivs } = commentStores;
    const borderClass = 'border-primary';
    const normalSpanBackgroundColorClass = 'bg-primary/20';
    const selectedSpanBackgroundColorClass = ['bg-primary/50', 'border-2', borderClass];

    let parentDiv: HTMLDivElement | null = $state(null);
    let bubbledClick = $state(false);
    let focused = $state(false);
    let isCommenting = $state(false);

    onMount(() => {
        const existing = $sidebarParentDivs.find((x) => x.threadId === thread.id);
        if (existing && parentDiv) {
            existing.div = parentDiv;
            existing.click = () => focusParent(true);
        } else if (parentDiv) {
            $sidebarParentDivs.push({ threadId: thread.id, div: parentDiv, click: () => focusParent(true) });
        }
    });

    const focusParent = (fromInlineClick: boolean) => {
        bubbledClick = true;
        if (!focused) {
            if (isCommenting) {
                parentDiv?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } else {
                parentDiv?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        for (let i = 0; i < $sidebarParentDivs.length; i++) {
            const currentParentDiv = $sidebarParentDivs[i]?.div;
            if (!thread.resolved && currentParentDiv === parentDiv && parentDiv) {
                focused = true;
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
            const span = document.getElementById(commentMark.spanId);
            span?.classList.add(...selectedSpanBackgroundColorClass);
            span?.classList.remove(normalSpanBackgroundColorClass);

            if (!fromInlineClick) {
                span?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const onAnyClick = () => {
        if (bubbledClick) {
            bubbledClick = false;
            return;
        }

        focused = false;

        if (parentDiv) {
            parentDiv.classList.remove(borderClass);
        }

        if (thread.resolved) return;

        const commentMark = $commentMarks.find((x) => x.threadId === thread.id);
        if (commentMark) {
            const span = document.getElementById(commentMark.spanId);
            span?.classList.add(normalSpanBackgroundColorClass);
            span?.classList.remove(...selectedSpanBackgroundColorClass);
        }
    };
</script>

<svelte:window onclick={onAnyClick} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    bind:this={parentDiv}
    class="rounded-md border-2 {thread.resolved && 'bg-gray-100'}"
    onclick={() => focusParent(false)}
>
    <CommentThread componentSource="sidebar" {commentStores} threadId={thread.id} bind:isCommenting {parentDiv} />
</div>

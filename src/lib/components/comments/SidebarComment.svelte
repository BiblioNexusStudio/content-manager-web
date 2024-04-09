<script lang="ts">
    import CommentThread from '$lib/components/comments/CommentThread.svelte';
    import type { CommentThread as CommentThreadType } from '$lib/types/comments';
    import type { CommentStores } from '$lib/stores/comments';
    import { onMount } from 'svelte';

    export let commentStores: CommentStores;
    export let thread: CommentThreadType;
    export let allParents: HTMLDivElement[];

    const { commentMarks } = commentStores;
    let parentDiv: HTMLDivElement;
    let bubbledClick = false;
    const borderClass = 'border-primary';
    const normalSpanBackgroundColorClass = 'bg-primary/20';
    const selectedSpanBackgroundColorClass = ['bg-primary/50', 'border-2', borderClass];

    onMount(() => {
        allParents.push(parentDiv);

        parentDiv.onclick = () => {
            console.log('regular click');
            bubbledClick = true;
            parentDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            for (let i = 0; i < allParents.length; i++) {
                if (!thread.resolved && allParents[i] === parentDiv) {
                    parentDiv.classList.add(borderClass);
                    highlightCommentSpan();
                } else {
                    allParents[i]?.classList.remove(borderClass);
                }
            }
        };
    });

    const highlightCommentSpan = () => {
        const commentMark = $commentMarks.find((x) => x.threadId === thread.id);
        if (commentMark) {
            const span = document.getElementById(commentMark.spanId) as HTMLSpanElement;
            span.classList.add(...selectedSpanBackgroundColorClass);
            span.classList.remove(normalSpanBackgroundColorClass);
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

<div bind:this={parentDiv} class="rounded-md border-2" class:bg-gray-100={thread.resolved}>
    <CommentThread {commentStores} threadId={thread.id} />
</div>

<script lang="ts">
    import type { CommentStores } from '$lib/stores/comments';
    import SidebarComment from '$lib/components/comments/SidebarComment.svelte';

    export let commentStores: CommentStores;

    const { commentThreads, commentMarks } = commentStores;

    $: orderedThreads = ($commentMarks && $commentThreads?.threads && getOrderedThreads()) ?? [];
    $: unresolvedThreads = orderedThreads.filter((x) => !x.resolved) ?? [];
    $: resolvedThreads = orderedThreads.filter((x) => x.resolved) ?? [];
    $: commentCount = orderedThreads.reduce((count, thread) => {
        return count + thread.comments.length;
    }, 0);

    const getOrderedThreads = () => {
        // The purpose of this is to get the comment spans as they appear in the editor
        // and then order the threads in the sidebar in the same way.
        const mainThreads = $commentThreads?.threads.filter((x) => x.id !== -1) ?? [];
        const foundSpanThreadIds: number[] = [];
        const inlineSpans = document.getElementsByClassName('inline-comment-span');
        for (let i = 0; i < inlineSpans.length; i++) {
            const spanThreadId = inlineSpans.item(i)?.attributes.getNamedItem('data-threadid')?.value;
            if (spanThreadId) {
                foundSpanThreadIds.push(parseInt(spanThreadId));
            }
        }

        return mainThreads.sort((a, b) => {
            const idA = foundSpanThreadIds.indexOf(a.id);
            const idB = foundSpanThreadIds.indexOf(b.id);

            return idA - idB;
        });
    };
</script>

<div class="w-full flex-col space-y-4 overflow-y-auto p-4">
    <div class="text-lg font-semibold">Comments ({commentCount})</div>
    {#each unresolvedThreads as thread (thread.id)}
        <SidebarComment {commentStores} {thread} />
    {/each}
    {#each resolvedThreads as thread (thread.id)}
        <SidebarComment {commentStores} {thread} />
    {/each}
</div>

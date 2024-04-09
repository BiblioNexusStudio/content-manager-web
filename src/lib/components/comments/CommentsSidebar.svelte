<script lang="ts">
    import type { CommentStores } from '$lib/stores/comments';
    import SidebarComment from '$lib/components/comments/SidebarComment.svelte';

    export let commentStores: CommentStores;

    const { commentThreads } = commentStores;
    const allParents: HTMLDivElement[] = [];

    $: threads = $commentThreads?.threads.filter((x) => x.id !== -1) ?? [];
    $: unresolvedThreads = $commentThreads?.threads.filter((x) => x.id !== -1 && !x.resolved) ?? [];
    $: resolvedThreads = $commentThreads?.threads.filter((x) => x.id !== -1 && x.resolved) ?? [];
    $: commentCount = threads.reduce((count, thread) => {
        return count + thread.comments.length;
    }, 0);
</script>

<div class="w-full flex-col space-y-4 overflow-y-auto p-4">
    <div class="text-lg font-semibold">Comments ({commentCount})</div>
    {#each unresolvedThreads as thread (thread.id)}
        <SidebarComment {commentStores} {thread} {allParents} />
    {/each}
    {#each resolvedThreads as thread (thread.id)}
        <SidebarComment {commentStores} {thread} {allParents} />
    {/each}
</div>

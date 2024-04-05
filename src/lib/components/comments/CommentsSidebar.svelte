<script lang="ts">
    import type { CommentStores } from '$lib/stores/comments';
    import CommentThread from '$lib/components/comments/CommentThread.svelte';

    export let commentStores: CommentStores;
    const { commentThreads } = commentStores;
    $: threads = $commentThreads?.threads.filter((x) => x.id !== -1) ?? [];

    console.log($commentThreads);
</script>

<div class="w-full flex-col space-y-2 overflow-y-auto p-4">
    <div class="text-lg font-semibold">Comments ({threads.length})</div>
    {#each threads as thread (thread.id)}
        <div class="rounded-md border-2">
            <CommentThread {commentStores} threadId={thread.id} />
        </div>
    {/each}
</div>

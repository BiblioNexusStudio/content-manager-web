<script lang="ts">
    import type { CommentStores } from '$lib/stores/comments';

    export let commentStores: CommentStores;
    const { commentThreads } = commentStores;
    $: threads = $commentThreads?.threads.filter((x) => x.id !== -1) ?? [];

    console.log($commentThreads);
</script>

<div class="flex-col">
    <div class="text-lg font-semibold">Comments ({threads.length})</div>
    {#each threads as thread (thread.id)}
        {#each thread.comments as comment (comment)}
            {comment.comment}
        {/each}
    {/each}
</div>

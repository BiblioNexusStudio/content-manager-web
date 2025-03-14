<script lang="ts">
    import type { CommentStores } from '$lib/stores/comments';
    import SidebarComment from '$lib/components/comments/SidebarComment.svelte';
    import type { CommentThread } from '$lib/types/comments';

    interface Props {
        commentStores: CommentStores;
    }

    let { commentStores }: Props = $props();

    const { commentThreads, commentMarks } = commentStores;

    const getOrderedThreads = (threads: CommentThread[]) => {
        // The purpose of this is to get the comment spans as they appear in the editor
        // and then order the threads in the sidebar in the same way.
        const mainThreads = threads.filter((x) => x.id !== -1) ?? [];
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

    let orderedThreads = $derived(($commentMarks && getOrderedThreads($commentThreads?.threads ?? [])) ?? []);
    let unresolvedThreads = $derived(orderedThreads.filter((x) => !x.resolved) ?? []);
    let resolvedThreads = $derived(orderedThreads.filter((x) => x.resolved) ?? []);
    let commentCount = $derived(
        orderedThreads.reduce((count, thread) => {
            return count + thread.comments.length;
        }, 0)
    );
</script>

<div class="w-full flex-col space-y-4 overflow-y-auto p-4">
    <div class="text-lg font-semibold whitespace-nowrap">Comments ({commentCount})</div>
    {#each unresolvedThreads as thread (thread.id)}
        <SidebarComment {commentStores} {thread} />
    {/each}
    {#each resolvedThreads as thread (thread.id)}
        <SidebarComment {commentStores} {thread} />
    {/each}
</div>

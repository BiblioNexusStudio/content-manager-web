<script lang="ts">
    import type { PassageReference } from '$lib/types/resources';
    import EmptyMessage from './EmptyMessage.svelte';

    export let bibleReferences: PassageReference[];

    function generateVerseFromReference(reference: PassageReference): string {
        let label = '';
        if (reference.startBook === reference.endBook) {
            if (reference.startChapter === reference.endChapter) {
                label = `${reference.startBook} ${reference.startChapter}:${reference.startVerse}-${reference.endVerse}`;
            } else {
                label = `${reference.startBook} ${reference.startChapter}:${reference.startVerse}-${reference.endChapter}:${reference.endVerse}`;
            }
        } else {
            label = `${reference.startBook} ${reference.startChapter}:${reference.startVerse} - ${reference.endBook} ${reference.endChapter}:${reference.endVerse}`;
        }
        return label;
    }
</script>

<div class="flex min-h-[calc(26.5%-8px)] grow flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Bible References</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        <div class="flex w-full flex-col">
            {#if bibleReferences.length > 0}
                {#each bibleReferences as bibleReference}
                    <div class="mb-4 flex w-full justify-between">
                        <p class="font-bold">{generateVerseFromReference(bibleReference)}</p>
                    </div>
                {/each}
            {:else}
                <EmptyMessage message="No bible references" />
            {/if}
        </div>
    </div>
</div>

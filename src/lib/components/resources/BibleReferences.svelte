<script lang="ts">
    import type { PassageReference, VerseReference } from '$lib/types/resources';
    import { instanceOfPassageReference } from '$lib/utils/reference';
    import EmptyMessage from './EmptyMessage.svelte';

    export let bibleReferences: (PassageReference | VerseReference)[];

    function generateVerseFromReference(reference: PassageReference | VerseReference): string {
        let label = '';
        if (instanceOfPassageReference(reference)) {
            if (reference.startBook === reference.endBook) {
                if (reference.startChapter === reference.endChapter) {
                    label = `${reference.startBook} ${reference.startChapter}:${reference.startVerse}-${reference.endVerse}`;
                } else {
                    label = `${reference.startBook} ${reference.startChapter}:${reference.startVerse}-${reference.endChapter}:${reference.endVerse}`;
                }
            } else {
                label = `${reference.startBook} ${reference.startChapter}:${reference.startVerse} - ${reference.endBook} ${reference.endChapter}:${reference.endVerse}`;
            }
        } else {
            label = `${reference.book} ${reference.chapter}:${reference.verse}`;
        }

        return label;
    }
</script>

<div class="flex h-fit max-h-72 flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Bible References</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        <div class="flex w-full flex-col">
            {#each bibleReferences as bibleReference, i (i)}
                <div class="mb-4 flex w-full justify-between">
                    <p class="font-bold">{generateVerseFromReference(bibleReference)}</p>
                </div>
            {:else}
                <EmptyMessage message="No bible references" />
            {/each}
        </div>
    </div>
</div>

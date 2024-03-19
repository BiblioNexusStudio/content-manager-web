<script lang="ts">
    import type { PassageReference, VerseReference } from '$lib/types/resources';
    import { instanceOfPassageReference } from '$lib/utils/reference';
    import EmptyMessage from '../EmptyMessage.svelte';
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

<div class="dropdown ms-1">
    <button class="btn btn-ghost ms-2 whitespace-nowrap px-1 hover:bg-[#e6f6fc]"> Bible References </button>
    <div class="menu dropdown-content z-[1] mt-4 max-h-72 w-auto rounded-box bg-base-100 px-8 pt-4 shadow">
        <div class="h-full overflow-y-scroll rounded-lg bg-white">
            <div class="flex w-full flex-col">
                {#each bibleReferences as bibleReference, i (i)}
                    <div class="mb-4 flex w-full justify-between">
                        <p class="whitespace-nowrap font-bold">{generateVerseFromReference(bibleReference)}</p>
                    </div>
                {:else}
                    <EmptyMessage message="No bible references" />
                {/each}
            </div>
        </div>
    </div>
</div>

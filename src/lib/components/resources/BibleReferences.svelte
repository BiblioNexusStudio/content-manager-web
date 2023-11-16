<script lang="ts">
    import Accordion from '$lib/components/resources/Accordion.svelte';
    import type { PassageReference } from '$lib/types/resources';
    import EmptyMessage from './EmptyMessage.svelte';

    export let bibleReferences: PassageReference[];

    function generateVerseFromReference(reference: PassageReference): string {
        return `${reference.startBook} ${reference.startChapter}:${reference.startVerse} - ${reference.endBook} ${reference.endChapter}:${reference.endVerse}`;
    }
</script>

<Accordion title="Bible References" closable={true}>
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
</Accordion>

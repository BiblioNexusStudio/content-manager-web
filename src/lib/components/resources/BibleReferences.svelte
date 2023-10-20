<script lang="ts">
    import Accordion from '$lib/components/resources/Accordion.svelte';
    import type { PassageReference } from '$lib/types/resources';
    import EmptyMessage from './EmptyMessage.svelte';

    export let bibleRefernces: PassageReference[];

    function generateVerseFromReference(reference: PassageReference): string {
        return `${reference.startBook} ${reference.startChapter}:${reference.startVerse} - ${reference.endBook} ${reference.endChapter}:${reference.endVerse}`;
    }
</script>

<Accordion title="Bible References" closable={true}>
    <div class="flex w-full flex-col">
        {#if bibleRefernces.length > 0}
            {#each bibleRefernces as bibleRefernce}
                <div class="mb-4 flex w-full justify-between">
                    <p class="font-bold">{generateVerseFromReference(bibleRefernce)}</p>
                </div>
            {/each}
        {:else}
            <EmptyMessage message="No bible references" />
        {/if}
    </div>
</Accordion>

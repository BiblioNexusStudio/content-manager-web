<script lang="ts">
    import Accordion from '$lib/components/resources/Accordion.svelte';

    const bibleRefernces = [
        {
            verse: '2 Kings 2:1-10',
            embeddedIntext: true,
        },
        {
            verse: 'Habakkuk 2:1-10',
            embeddedIntext: true,
        },
        {
            verse: 'Habakkuk 2:1-10',
            embeddedIntext: true,
        },
        {
            verse: 'Habakkuk 2:1-10',
            embeddedIntext: false,
        },
    ];
</script>

<Accordion title="Bible References" closable={true}>
    <div class="flex w-full flex-col">
        {#each bibleRefernces as bibleRefernce}
            <div class="mb-4 flex w-full justify-between">
                <p class="font-bold">{bibleRefernce.verse}</p>
                {#if bibleRefernce.embeddedIntext}
                    <p class="text-green-500">Embedded in text</p>
                {/if}
            </div>
        {/each}
    </div>
</Accordion>

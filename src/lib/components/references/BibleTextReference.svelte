<script lang="ts">
    import type { BibleTextsReference } from '$lib/components/references/bibleTextReferenceFetcher';
    import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte';
    import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte';

    export let bibleTextsReference: BibleTextsReference;
    export let collapsible = false;
    export let isOpen = true;

    let titleDiv: HTMLDivElement | null;

    const open = () => {
        if (collapsible) {
            isOpen = !isOpen;
            if (isOpen) {
                titleDiv?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    bind:this={titleDiv}
    class="mb-2 {collapsible ? 'cursor-pointer' : ''} flex place-items-end font-semibold"
    on:click={open}
>
    {#if collapsible}
        {#if isOpen}
            <ChevronUpIcon />
        {:else}
            <ChevronDownIcon />
        {/if}
    {/if}
    {bibleTextsReference.verseDisplayName}
</div>
<div class={isOpen ? '' : 'hidden'}>
    {#each bibleTextsReference.bookTexts as text (text)}
        {#if !bibleTextsReference.isSingleBook}
            <div class="font-semibold">{text.bookName}</div>
        {/if}
        {#each text.chapters as chapter (chapter)}
            {#if !bibleTextsReference.isSingleChapter}
                <div class="font-semibold">Chapter {chapter.number}</div>
            {/if}
            {#each chapter.verses as verse (verse)}
                <div><sup class="font-bold">{verse.number}</sup> {verse.text}</div>
            {/each}
        {/each}
    {/each}
</div>

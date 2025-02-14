<script lang="ts">
    import type { BibleTextsReference } from '$lib/components/references/bibleTextReferenceFetcher';
    import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte';
    import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte';

    interface Props {
        bibleTextsReferences: BibleTextsReference[];
        collapsible?: boolean;
        isOpen?: boolean;
    }

    let { bibleTextsReferences, collapsible = false, isOpen = $bindable(true) }: Props = $props();

    let titleDiv: HTMLDivElement | null = $state(null);

    const open = () => {
        if (collapsible) {
            isOpen = !isOpen;
            if (isOpen) {
                titleDiv?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };
</script>

{#each bibleTextsReferences as bibleTextsReference, i (i)}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        bind:this={titleDiv}
        class="mb-2 {collapsible ? 'cursor-pointer' : ''} flex place-items-end font-semibold"
        onclick={open}
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
                <div class="font-semibold" dir="auto">{text.bookName}</div>
            {/if}
            {#each text.chapters as chapter (chapter)}
                {#if !bibleTextsReference.isSingleChapter}
                    <div class="font-semibold" dir="auto">Chapter {chapter.number}</div>
                {/if}
                {#each chapter.verses as verse (verse)}
                    <div dir="auto"><sup class="font-bold">{verse.number}</sup> {verse.text}</div>
                {/each}
            {/each}
        {/each}
    </div>
{/each}

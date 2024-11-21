<script lang="ts">
    import CalendarCheck from '$lib/icons/CalendarCheck.svelte';
    import TextDocIcon from '$lib/icons/TextDocIcon.svelte';
    import WrenchScrewdriverSolidIcon from '$lib/icons/WrenchScrewdriverSolidIcon.svelte';
    import { HelpDocumentType, type HelpDocument } from '$lib/types/helpDocuments';

    export let document: HelpDocument;

    // some documents have dates in front, and by parsing this we can put the date on its own line
    $: dateString = document.title.match(/\d{2}-[A-Za-z]{3}-\d{4}/)?.[0] ?? '';

    $: titleString = document.title.replace(/^\d{2}-[A-Za-z]{3}-\d{4}\s*/, '');
</script>

<a href={document.url} target="_blank" class="overflow flex w-40 flex-col items-center hover:text-primary">
    <span class="w-16">
        {#if document.thumbnailUrl}
            <img src={document.thumbnailUrl} alt={document.title} class="h-full w-full object-contain" />
        {:else if document.type === HelpDocumentType.HowTo}
            <WrenchScrewdriverSolidIcon />
        {:else if document.type === HelpDocumentType.Release}
            <CalendarCheck />
        {:else}
            <TextDocIcon />
        {/if}
    </span>

    <div class="flex flex-col items-center">
        {#if dateString}
            <span class="text-center">{dateString}</span>
        {/if}
        <span class="line-clamp-2 text-center">{titleString}</span>
    </div>
</a>

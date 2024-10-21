<script lang="ts">
    import CalendarCheck from '$lib/icons/CalendarCheck.svelte';
    import TextDocIcon from '$lib/icons/TextDocIcon.svelte';
    import WrenchScrewdriverSolidIcon from '$lib/icons/WrenchScrewdriverSolidIcon.svelte';
    import { HelpDocumentType, type HelpDocument } from '$lib/types/helpDocuments';

    export let document: HelpDocument;
</script>

<a href={document.url} target="_blank" class="overflow flex h-32 w-36 flex-col items-center hover:text-primary">
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

    <span class="line-clamp-2 h-12">{document.title}</span>
</a>

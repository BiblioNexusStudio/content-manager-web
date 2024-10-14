<script lang="ts">
    import CalendarCheck from '$lib/icons/CalendarCheck.svelte';
    import TextDocIcon from '$lib/icons/TextDocIcon.svelte';
    import WrenchScrewdriverSolidIcon from '$lib/icons/WrenchScrewdriverSolidIcon.svelte';
    import { HelpDocumentType } from '$lib/types/helpDocuments';

    export let type: HelpDocumentType;
</script>

<span class="w-16">
    {#if type === HelpDocumentType.HowTo}
        <WrenchScrewdriverSolidIcon />
    {:else if type === HelpDocumentType.Release}
        <CalendarCheck />
    {:else}
        <TextDocIcon />
    {/if}
</span>

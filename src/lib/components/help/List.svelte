<script lang="ts">
    import Document from './Document.svelte';
    import type { HelpDocument } from '$lib/types/helpDocuments';

    export let documents: HelpDocument[] = [];
</script>

<ul class="flex flex-wrap gap-x-6 gap-y-4 p-4">
    {#each documents as document (document.title)}
        <Document {document} />
    {/each}
</ul>

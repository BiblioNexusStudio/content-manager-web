<script lang="ts">
    import Icon from './Icon.svelte';
    import type { HelpDocument } from '$lib/types/helpDocuments';

    export let document: HelpDocument;
</script>

<a href={document.url} class="overflow flex h-32 w-20 flex-col items-center hover:text-primary">
    <Icon type={document.type} />
    <span class="line-clamp-2 h-12">{document.title}</span>
</a>

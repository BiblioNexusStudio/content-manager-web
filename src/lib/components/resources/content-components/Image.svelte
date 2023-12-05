<script lang="ts">
    import type { ContentItem } from '$lib/types/resources';

    export let content: ContentItem | ContentItem[];
    $: url = (content as ContentItem).url;
    $: altText = (content as ContentItem).displayName;
</script>

<img class="w-full" src={url} alt={altText} />

<script lang="ts">
    import type { ContentItem } from '$lib/types/resources';

    export let content: ContentItem | ContentItem[];
    $: url = (content as ContentItem).url;
    $: thumbnailUrl = (content as ContentItem).thumbnailUrl;
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video controls class="w-full" poster={thumbnailUrl}>
    <source src={url} type="video/mp4" />
</video>

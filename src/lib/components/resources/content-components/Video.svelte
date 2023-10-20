<script lang="ts">
    import { filteredResourcesByLanguage } from '$lib/store/resources';
    import type { ContentItem } from '$lib/types/resources';

    const contentArray: ContentItem[] = $filteredResourcesByLanguage.map((resource) => resource.content as ContentItem);
    const content = contentArray[0];
    const url = content?.url;
    const thumbnailUrl = content?.thumbnailUrl;
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video controls class="w-full" poster={thumbnailUrl}>
    <source src={url} type="video/mp4" />
</video>

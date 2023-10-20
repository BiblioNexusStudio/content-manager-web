<script lang="ts">
    import { filteredResourcesByLanguage } from '$lib/store/resources';
    import type { ContentItem } from '$lib/types/resources';

    const contentArray: ContentItem[] = $filteredResourcesByLanguage.map((resource) => resource.content as ContentItem);
    const content = contentArray[0];
    const url = content?.url;
    const altText = content?.displayName;
</script>

<img class="w-full" src={url} alt={altText} />

<script lang="ts">
    import type { ImageContentItem } from '$lib/types/resources';

    export let content: ImageContentItem;
</script>

<img class="mx-auto h-full w-auto object-contain" src={content.url} alt={content.displayName} />

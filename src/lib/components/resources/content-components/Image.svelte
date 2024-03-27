<script lang="ts">
    import type { ImageContentItem } from '$lib/types/resources';

    export let content: ImageContentItem;
</script>

<div class="relative h-full w-full">
    <img class="absolute h-full w-full object-contain" src={content.url} alt={content.displayName} />
</div>

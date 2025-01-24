<script lang="ts">
    import type { ImageContentItem } from '$lib/types/resources';

    interface Props {
        content: ImageContentItem;
    }

    let { content }: Props = $props();
</script>

<div class="relative h-full w-full">
    <img class="absolute h-full w-full object-contain" src={content.url} alt={content.displayName} />
</div>

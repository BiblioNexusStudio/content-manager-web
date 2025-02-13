<script lang="ts">
    import type { VideoContentItem } from '$lib/types/resources';

    interface Props {
        content: VideoContentItem;
    }

    let { content }: Props = $props();
</script>

<div class="relative h-full w-full">
    <!-- svelte-ignore a11y_media_has_caption -->
    <video controls class="absolute h-full w-full" poster={content.thumbnailUrl}>
        <source src={content.url} type="video/mp4" />
    </video>
</div>

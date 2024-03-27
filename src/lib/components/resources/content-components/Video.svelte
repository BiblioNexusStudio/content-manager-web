<script lang="ts">
    import type { VideoContentItem } from '$lib/types/resources';

    export let content: VideoContentItem;
</script>

<div class="relative h-full w-full">
    <!-- svelte-ignore a11y-media-has-caption -->
    <video controls class="absolute h-full w-full" poster={content.thumbnailUrl}>
        <source src={content.url} type="video/mp4" />
    </video>
</div>

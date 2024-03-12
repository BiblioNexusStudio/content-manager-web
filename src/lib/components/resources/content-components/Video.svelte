<script lang="ts">
    import type { VideoContentItem } from '$lib/types/resources';

    export let content: VideoContentItem;
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video controls class="w-full" poster={content.thumbnailUrl}>
    <source src={content.url} type="video/mp4" />
</video>

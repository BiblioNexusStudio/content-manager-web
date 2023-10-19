<script lang="ts">
    import { filteredResourcesByLanguage } from '$lib/store/resources';

    $: url = $filteredResourcesByLanguage[0]?.content?.url;
    $: previewImage = $filteredResourcesByLanguage[0]?.content?.thumbnailUrl;
</script>

<video controls class="w-full" poster={previewImage}>
    <source src={url} type="video/mp4" />
    <track kind="captions" />
    Your browser does not support the video tag.
</video>

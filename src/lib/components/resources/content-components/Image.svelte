<script lang="ts">
    import { filteredResourcesByLanguage } from '$lib/store/resources';

    $: url = $filteredResourcesByLanguage[0]?.content?.url;
    $: altText = $filteredResourcesByLanguage[0]?.displayName;
</script>

<img class="w-full" src={url} alt={altText} />

<script lang="ts">
    import Tiptap from '$lib/Tiptap.svelte';
    import type { ResourceItem } from '$lib/types/resources';

    export let currentLanguageResourses: ResourceItem[];
</script>

<div>
    <Tiptap htmlDefault={currentLanguageResourses[1]?.content[0]?.tiptap} />
</div>

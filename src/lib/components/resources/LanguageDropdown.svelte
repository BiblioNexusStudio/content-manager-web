<script lang="ts">
    import type { Language } from '$lib/types/resources';
    import { languageId } from '$lib/store/resources';

    export let languageSet: Language[];
</script>

<select bind:value={$languageId} class="select select-info font-semibold">
    <option value="" disabled selected>Select a Language</option>
    {#each languageSet as { id, displayName }}
        <option value={id}>{displayName}</option>
    {/each}
</select>

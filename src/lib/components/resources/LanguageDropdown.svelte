<script lang="ts">
    import { goto } from '$app/navigation';

    export let languageSet: { label: string | undefined; contentId: number }[];
    export let disable = true;

    $: filteredLanguageSet = languageSet.filter(({ label }) => !!label);

    function onChange(event: Event) {
        const element = event.target as HTMLSelectElement;
        goto(`/resources/${element.value}`);
    }
</script>

{#if filteredLanguageSet.length > 0}
    <select on:change={onChange} class="select select-info font-semibold" disabled={disable}>
        <option value="" disabled selected>Select a Language</option>
        {#each filteredLanguageSet as { label, contentId }}
            <option value={contentId}>{label}</option>
        {/each}
    </select>
{/if}

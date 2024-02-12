<script lang="ts">
    import type { Language } from '$lib/types/base';
    import type { ContentTranslation } from '$lib/types/resources';

    export let allLanguages: Language[];
    export let existingTranslations: ContentTranslation[];
    export let selectedLanguageId: string | null;

    const languagesToShow = allLanguages.filter((x) => existingTranslations.every((et) => et.languageId !== x.id));
</script>

{#if languagesToShow}
    <select bind:value={selectedLanguageId} class="select select-bordered">
        <option disabled value={null} selected>Select language</option>
        {#each languagesToShow as language}
            <option value={language.id}>{language.englishDisplay}</option>
        {/each}
    </select>
{/if}

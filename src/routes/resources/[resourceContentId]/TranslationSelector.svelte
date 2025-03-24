<script lang="ts">
    import type { Language } from '$lib/types/base';
    import type { ContentTranslation } from '$lib/types/resources';

    interface Props {
        allLanguages: Language[];
        existingTranslations: ContentTranslation[];
        selectedLanguageId: number | null;
    }

    let { allLanguages, existingTranslations, selectedLanguageId = $bindable() }: Props = $props();

    let languagesToShow = $derived(
        allLanguages.filter((x) => existingTranslations.every((et) => et.languageId !== x.id))
    );
</script>

<select bind:value={selectedLanguageId} class="select select-bordered w-full">
    <option disabled value={null} selected>Select language</option>
    {#each languagesToShow as language (language.id)}
        <option value={language.id}>{language.englishDisplay}</option>
    {/each}
</select>

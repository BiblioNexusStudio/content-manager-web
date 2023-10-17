<script lang="ts">
    let lang = '';

    const supportedLanguages = [
        { code: 'eng', label: 'English' },
        { code: 'hin', label: 'हिंदी' },
        { code: 'tpi', label: 'Tok Pisin' },
    ];

    function onLanguageSelected() {
        console.log('lang', lang);
    }
</script>

<select on:change={onLanguageSelected} bind:value={lang} class="select select-info font-semibold">
    <option value="" disabled selected>Select a Language</option>
    {#each supportedLanguages as { code, label }}
        <option value={code}>{label}</option>
    {/each}
</select>

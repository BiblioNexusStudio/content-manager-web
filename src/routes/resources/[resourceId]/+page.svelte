<script lang="ts">
    import Back from '$lib/components/resources/Back.svelte';
    import LanguageDropdown from '$lib/components/resources/LanguageDropdown.svelte';
    import Overview from '$lib/components/resources/Overview.svelte';
    import Details from '$lib/components/resources/Details.svelte';
    import RelatedContent from '$lib/components/resources/RelatedContent.svelte';
    import BibleReferences from '$lib/components/resources/BibleReferences.svelte';
    import Content from '$lib/components/resources/Content.svelte';
</script>

<div class="p-8">
    <div class="mb-8 flex items-center">
        <Back />
        <h1 class="mr-8 text-2xl font-bold">Translation Guide - Mark 2:1-10</h1>
        <LanguageDropdown />
    </div>
    <div class="flex">
        <div class="mr-8 flex w-4/12 flex-col">
            <Overview labelText="Habakkuk (person) Aquifer" typeText="Tyndale Bible Dictionary" />
            <Details translationStatusText="Draft" sizeText="1.2 MB" />
            <RelatedContent />
            <BibleReferences />
        </div>
        <div class="flex w-8/12 flex-col">
            <Content />
        </div>
    </div>
</div>

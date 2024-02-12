<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import MagnifyingGlassIcon from '$lib/icons/MagnifyingGlassIcon.svelte';

    export let projectSearchValue = '';
</script>

<div class="relative h-full grow">
    <input
        type="text"
        class="h-full w-full rounded-md border-[1px] bg-gray-200 py-2 pe-12 ps-4 text-sm focus:outline-none"
        placeholder={$translate('page.resources.searchBox.value')}
        bind:value={projectSearchValue}
    />
    <div class="absolute right-4 top-1/2 -translate-y-1/2 transform text-primary">
        <MagnifyingGlassIcon />
    </div>
</div>

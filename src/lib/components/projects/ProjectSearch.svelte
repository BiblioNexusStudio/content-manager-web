<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    export let projectSearchValue = '';
</script>

<div class="h-full grow">
    <input
        type="text"
        class="h-full w-full rounded-md border-[1px] py-2 ps-4 text-sm focus:outline-none"
        placeholder={$translate('page.resources.searchBox.value')}
        bind:value={projectSearchValue}
    />
</div>

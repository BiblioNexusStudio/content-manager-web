<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    export let projectSearchValue = '';
</script>

<input
    type="text"
    class="input input-bordered w-full"
    placeholder={$translate('page.resources.searchBox.value')}
    bind:value={projectSearchValue}
/>

<script lang="ts">
    import { _ as translate } from 'svelte-i18n';

    interface Props {
        projectSearchValue: string;
    }

    let { projectSearchValue = $bindable() }: Props = $props();
</script>

<input
    type="text"
    class="input input-bordered w-full"
    placeholder={$translate('page.resources.searchBox.value')}
    bind:value={projectSearchValue}
/>

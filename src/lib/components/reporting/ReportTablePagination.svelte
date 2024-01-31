<script lang="ts">
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import chevronRight from 'svelte-awesome/icons/chevronRight';
    import Icon from 'svelte-awesome/components/Icon.svelte';
    import { listData, paginationStart, paginationEnd } from '$lib/stores/reporting';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export let tableData: Array<any> = [];

    $: $listData = tableData;

    $: listDataLength = $listData.length;

    function handleLeftClick() {
        if ($paginationStart === 0) return;

        if ($paginationEnd === listDataLength) {
            const remainder = $paginationEnd % 100;

            $paginationEnd = $paginationEnd - remainder;
            $paginationStart = $paginationStart - 100;
            return;
        }

        $paginationStart = $paginationStart - 100;
        $paginationEnd = $paginationEnd - 100;

        if ($paginationStart < 100) {
            $paginationStart = 0;
            $paginationEnd = 100;
        }
    }

    function handleRightClick() {
        if ($paginationEnd === listDataLength) return;
        if ($paginationEnd + 100 > listDataLength) {
            $paginationStart = $paginationStart + 100;
            $paginationEnd = listDataLength;
            return;
        }
        $paginationStart = $paginationStart + 100;
        $paginationEnd = $paginationEnd + 100;
    }
</script>

<div class="flex h-full w-auto items-center justify-between">
    <button class="flex h-full w-12 justify-center" on:click={handleLeftClick}>
        <Icon data={chevronLeft} />
    </button>

    <span>{$paginationStart} - {$paginationEnd} of {listDataLength}</span>

    <button class="flex h-full w-12 justify-center" on:click={handleRightClick}>
        <Icon data={chevronRight} />
    </button>
</div>

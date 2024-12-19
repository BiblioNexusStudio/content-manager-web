<script lang="ts">
    import chevronLeft from 'svelte-awesome/icons/chevronLeft';
    import chevronRight from 'svelte-awesome/icons/chevronRight';
    import Icon from 'svelte-awesome/components/Icon.svelte';

    interface Props {
        perPage: number;
        paginationStart: number;
        paginationEnd: number;
        totalCount: number;
    }

    let { perPage, paginationStart = $bindable(), paginationEnd = $bindable(), totalCount }: Props = $props();

    function handleLeftClick() {
        if (paginationStart === 0) return;

        if (paginationEnd === totalCount) {
            const remainder = paginationEnd % perPage;

            paginationEnd = paginationEnd - remainder;
            paginationStart = paginationStart - perPage;
            return;
        }

        paginationStart = paginationStart - perPage;
        paginationEnd = paginationEnd - perPage;

        if (paginationStart < perPage) {
            paginationStart = 0;
            paginationEnd = perPage;
        }
    }

    function handleRightClick() {
        if (paginationEnd === totalCount) return;
        if (paginationEnd + perPage > totalCount) {
            paginationStart = paginationStart + perPage;
            paginationEnd = totalCount;
            return;
        }
        paginationStart = paginationStart + perPage;
        paginationEnd = paginationEnd + perPage;
    }
</script>

<div class="flex h-full w-auto items-center justify-between space-x-2">
    <button
        class="btn btn-link btn-secondary disabled:bg-white"
        onclick={handleLeftClick}
        disabled={paginationStart === 0}
    >
        <Icon data={chevronLeft} />
    </button>

    <span>{paginationStart + 1} - {paginationEnd} of {totalCount}</span>

    <button
        class="btn btn-link btn-secondary disabled:bg-white"
        onclick={handleRightClick}
        disabled={paginationEnd === totalCount}
    >
        <Icon data={chevronRight} />
    </button>
</div>

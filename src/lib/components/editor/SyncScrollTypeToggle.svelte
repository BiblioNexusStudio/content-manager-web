<script>
    import { isSyncScrollPercent } from '$lib/stores/scrollSync';
</script>

<button
    on:click={() => ($isSyncScrollPercent = !$isSyncScrollPercent)}
    class="btn h-auto min-h-0 p-1"
    class:btn-primary={$isSyncScrollPercent}
>
&percnt;
</button>

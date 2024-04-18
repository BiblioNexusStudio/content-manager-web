<script lang="ts">
    import { goto } from '$app/navigation';
    import ArrowLeftSmall from '$lib/icons/ArrowLeftSmall.svelte';

    export let defaultPathIfNoHistory: string;

    function goBack() {
        window.history.length > 1 ? window.history.back() : goto(defaultPathIfNoHistory);
    }
</script>

<button
    data-app-insights-event-name="back-arrow-click"
    class="btn btn-link btn-sm m-0 me-2 min-h-0 p-0 text-black"
    on:click={goBack}><ArrowLeftSmall /></button
>

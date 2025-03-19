<script lang="ts">
    import { goto } from '$app/navigation';
    import ArrowLeftSmall from '$lib/icons/ArrowLeftSmall.svelte';

    interface Props {
        defaultPathIfNoHistory: string;
    }

    let { defaultPathIfNoHistory }: Props = $props();

    function goBack() {
        window.history.length > 1 ? window.history.back() : goto(defaultPathIfNoHistory);
    }
</script>

<button
    data-app-insights-event-name="back-arrow-click"
    class="btn btn-link btn-sm text-base-content m-0 me-2 min-h-0 p-0"
    onclick={goBack}><ArrowLeftSmall /></button
>

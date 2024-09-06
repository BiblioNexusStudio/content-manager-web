<script lang="ts">
    import { goto } from '$app/navigation';

    export let defaultPathIfNoHistory: string;

    function goBack() {
        window.history.length > 1 ? window.history.back() : goto(defaultPathIfNoHistory);
    }
</script>

<button
    data-app-insights-event-name="exit-button-click"
    class="btn btn-outline btn-primary btn-sm border-2 font-extrabold"
    on:click={goBack}>Exit</button
>

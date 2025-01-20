<script lang="ts">
    import { goto } from '$app/navigation';

    interface Props {
        defaultPathIfNoHistory: string;
    }

    let { defaultPathIfNoHistory }: Props = $props();

    function goBack() {
        window.history.length > 1 ? window.history.back() : goto(defaultPathIfNoHistory);
    }
</script>

<button
    data-app-insights-event-name="exit-button-click"
    class="btn btn-outline btn-primary btn-sm border-2 font-extrabold"
    onclick={goBack}>Exit</button
>

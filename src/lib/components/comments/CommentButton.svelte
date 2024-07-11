<script lang="ts">
    export let appInsightsEventName: string | undefined = undefined;
    export let disabled = false;
</script>

<button
    class="btn btn-link no-animation !bg-white text-primary !no-underline"
    {disabled}
    data-app-insights-event-name={appInsightsEventName}
    on:click><slot /></button
>

<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        appInsightsEventName?: string | undefined;
        disabled?: boolean;
        children: Snippet;
        buttonProps: Record<string, unknown>;
    }
    let { appInsightsEventName = undefined, disabled = false, children, buttonProps }: Props = $props();
</script>

<button
    class="btn btn-link no-animation !bg-white text-primary !no-underline"
    {disabled}
    {...buttonProps}
    data-app-insights-event-name={appInsightsEventName}>{@render children()}</button
>

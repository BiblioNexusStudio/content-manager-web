<script lang="ts">
    // This component is necessary to prevent obscure rerendering issues until this is fixed: https://github.com/sveltejs/svelte/issues/8243

    interface Props {
        options: { value: string | null | number; label: string }[];
        value: string | number | null;
        isNumber?: boolean;
        disabled?: boolean;
        onChange?: (value: string | number | null) => unknown;
        appInsightsEventName?: string | undefined;
        class?: string;
    }

    let {
        options,
        value = $bindable(),
        isNumber = false,
        disabled = false,
        onChange = undefined,
        appInsightsEventName = undefined,
        class: className,
    }: Props = $props();

    function handleChange(event: Event) {
        const originalValue = value;
        const selectTarget = event.target as HTMLSelectElement;
        if (selectTarget.value === '' && options.some((o) => o.value === null)) {
            value = null;
        } else if (isNumber) {
            value = parseInt(selectTarget.value);
        } else {
            value = selectTarget.value;
        }
        const shouldChange = onChange && onChange(value);
        if (shouldChange === false) {
            value = originalValue;
        }
    }
</script>

<select {disabled} class={className} onchange={handleChange} {value}>
    {#each options as option (option.value)}
        <option data-app-insights-event-name={appInsightsEventName} value={option.value}>{option.label}</option>
    {/each}
</select>

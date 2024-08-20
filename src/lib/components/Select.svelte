<script lang="ts">
    // This component is necessary to prevent obscure rerendering issues until this is fixed: https://github.com/sveltejs/svelte/issues/8243

    export let options: { value: string | null | number; label: string }[];
    export let isNumber = false;
    export let value: string | number | null;
    export let disabled = false;
    export let onChange: ((value: string | number | null) => unknown) | undefined = undefined;
    export let appInsightsEventName: string | undefined = undefined;

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

<select {disabled} class={$$props.class} on:change={handleChange} {value}>
    {#each options as option (option.value)}
        <option data-app-insights-event-name={appInsightsEventName} value={option.value}>{option.label}</option>
    {/each}
</select>

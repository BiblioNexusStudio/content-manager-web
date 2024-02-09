<script lang="ts">
    // This component is necessary to prevent obscure rerendering issues until this is fixed: https://github.com/sveltejs/svelte/issues/8243

    export let options: { value: string | null | number; label: string }[];
    export let isNumber = false;
    export let value: string | number | null;
    export let disabled = false;

    function handleChange(event: Event) {
        const selectTarget = event.target as HTMLSelectElement;
        if (selectTarget.value === '') {
            value = null;
        } else if (isNumber) {
            value = parseInt(selectTarget.value);
        } else {
            value = selectTarget.value;
        }
    }
</script>

<select {disabled} class={$$props.class} on:change={handleChange} {value}>
    {#each options as option}
        <option value={option.value}>{option.label}</option>
    {/each}
</select>

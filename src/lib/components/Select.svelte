<script lang="ts">
    // This component is necessary to prevent obscure rerendering issues until this is fixed: https://github.com/sveltejs/svelte/issues/8243

    export let options: { value: string | number; label: string }[] = [];
    export let value = '';

    function handleChange(event: Event) {
        const selectTarget = event.target as HTMLSelectElement;
        value = selectTarget.value;
    }
</script>

<select class={$$props.class} on:change={handleChange} {value}>
    {#each options as option}
        <option value={option.value}>{option.label}</option>
    {/each}
</select>

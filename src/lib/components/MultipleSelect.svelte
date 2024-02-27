<script lang="ts">
    import { createListbox } from 'svelte-headlessui';

    interface Option {
        value: string | number;
        label: string;
    }

    export let options: Option[];
    export let values: string[] | number[];
    export let disabled = false;
    export let label: string;

    const listbox = createListbox({
        label,
        selected: options.filter((o) => (values as (number | string)[]).includes(o.value)),
    });
    $: listbox.set({ selected: options.filter((o) => (values as (number | string)[]).includes(o.value)) });
    $: title = $listbox.selected.map((s: Option) => s.label).join(', ');

    function onSelect(e: Event) {
        const selected = ((e as CustomEvent).detail as { selected: Option[] }).selected;
        values = selected.map((s) => s.value) as string[] | number[];
    }
</script>

<div class={$$props.class}>
    <div class="relative w-full">
        <button
            class="{$listbox.expanded &&
                'border-base-content/20 outline outline-2 outline-offset-2 outline-base-content/20'} select select-bordered flex h-auto w-full flex-row items-center py-2 {disabled &&
                'select-disabled text-black !text-opacity-70'}"
            use:listbox.button
            on:select={onSelect}
            {title}
            {disabled}
        >
            <div class="flex gap-2 truncate">
                {#if $listbox.selected.length === 1}
                    <span class="flex items-center gap-1">{$listbox.selected[0].label}</span>
                {:else if $listbox.selected.length === 0}
                    <span class="flex items-center gap-1">{label}</span>
                {:else}
                    <span class="flex items-center gap-1">({$listbox.selected.length}) Selected</span>
                {/if}
            </div>
        </button>

        {#if $listbox.expanded}
            <ul
                use:listbox.items
                class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
                {#each options as option (option.value)}
                    {@const active = $listbox.active === option}
                    {@const selected = $listbox.selected.includes(option)}
                    <li
                        class="group relative cursor-default select-none py-2 pl-4 pr-9 focus:outline-none {active
                            ? 'bg-primary text-white'
                            : 'text-gray-900'}"
                        use:listbox.item={{ value: option }}
                    >
                        <div class="flex flex-row">
                            <input type="checkbox" checked={selected} class="checkbox checkbox-sm" />
                            <span class="ms-2 truncate {selected ? 'font-semibold' : 'font-normal'}"
                                >{option.label}</span
                            >
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>

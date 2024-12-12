<script lang="ts">
    interface Option {
        value: string | number;
        label: string;
    }

    interface Props {
        options: Option[];
        values: string[] | number[];
        disabled?: boolean;
        label: string;
        class?: string;
    }

    let { options, values = $bindable(), disabled = false, label, class: className }: Props = $props();

    let expanded = $state(false);
    let activeIndex = $state(-1);

    let listboxRef: HTMLDivElement;

    function onClickOutside(event: MouseEvent) {
        if (listboxRef && !listboxRef.contains(event.target as Node)) {
            expanded = false;
        }
    }

    let selected = $derived(options.filter((o) => (values as (number | string)[]).includes(o.value)));
    let title = $derived(selected?.map((s: Option) => s.label).join(', '));

    function toggleExpanded() {
        expanded = !expanded;
    }

    function onSelect(option: Option) {
        if ((values as (number | string)[]).includes(option.value)) {
            values = (values as (number | string)[]).filter((v) => v !== option.value) as number[] | string[];
        } else {
            values = [...values, option.value] as number[] | string[];
        }
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            activeIndex = (activeIndex + 1) % options.length;
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            activeIndex = (activeIndex - 1 + options.length) % options.length;
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (activeIndex !== -1) {
                onSelect(options[activeIndex]!);
            }
        }

        if (activeIndex !== -1) {
            const activeItem = listboxRef.querySelector(`li:nth-child(${activeIndex + 1})`);
            activeItem?.scrollIntoView({ block: 'nearest' });
        }
    }

    function onmousedown(e: Event) {
        e.preventDefault();
    }
</script>

<svelte:window on:click={onClickOutside} />

<div bind:this={listboxRef} class={className}>
    <div class="relative w-full">
        <button
            class="{expanded &&
                'border-base-content/20 outline outline-2 outline-offset-2 outline-base-content/20'} select select-bordered flex h-auto w-full flex-row items-center py-2 {disabled &&
                'select-disabled text-black !text-opacity-70'}"
            onclick={toggleExpanded}
            onkeydown={onKeyDown}
            {title}
            {disabled}
        >
            <div class="flex gap-2 truncate">
                {#if selected.length === 1}
                    <span class="flex items-center gap-1">{selected[0]?.label}</span>
                {:else if selected.length === 0}
                    <span class="flex items-center gap-1">{label}</span>
                {:else}
                    <span class="flex items-center gap-1">({selected.length}) Selected</span>
                {/if}
            </div>
        </button>
        {#if expanded}
            <ul
                class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
                {#each options as option, index (option.value)}
                    {@const active = activeIndex === index}
                    {@const isSelected = selected.includes(option)}
                    <li>
                        <button
                            type="button"
                            class="group relative w-full cursor-pointer select-none py-2 pl-4 pr-9 focus:outline-none {active
                                ? 'bg-primary text-white'
                                : 'text-gray-900'}"
                            onclick={() => onSelect(option)}
                            onmouseenter={() => (activeIndex = index)}
                            {onmousedown}
                        >
                            <div class="flex flex-row">
                                <input type="checkbox" checked={isSelected} class="checkbox checkbox-sm" />
                                <span class="ms-2 truncate {isSelected ? 'font-semibold' : 'font-normal'}"
                                    >{option.label}</span
                                >
                            </div>
                        </button>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>

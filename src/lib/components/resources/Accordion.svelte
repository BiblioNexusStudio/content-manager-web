<script>
    export let title = '';
    export let closable = false;
    export let fullHeight = false;

    let open = true;
</script>

<div
    class="collapse {open ? 'collapse-open' : 'collapse-close'} mb-4 border border-base-300 bg-base-200 {closable
        ? 'collapse-arrow'
        : ''}"
>
    <input
        type="checkbox"
        on:click={() => {
            if (closable) open = !open;
        }}
    />
    <div class="collapse-title !rounded-b-none text-xl font-medium">{title}</div>
    <div
        class="collapse-content {fullHeight ? 'max-h-[75vh]' : 'max-h-32'} {open && closable
            ? '!py-2'
            : ''} overflow-y-scroll bg-white"
    >
        <slot />
    </div>
</div>

<script lang="ts">
    export let text: string;
    export let position: { top?: string; left?: string; bottom?: string; right?: string };
</script>

<div class="tooltip-container relative flex items-center">
    <div class="peer flex items-center">
        <slot />
    </div>

    <div
        style="top: {position.top ?? 'none'}; left: {position.left ?? 'none'}; bottom: {position.bottom ??
            'none'}; right:
        {position.right ?? 'none'};"
        class="tooltip absolute hidden whitespace-nowrap rounded-xl border-2 bg-white px-2 text-sm font-bold opacity-0 transition peer-hover:flex peer-hover:opacity-100
        {$$props.class}"
    >
        {text}
    </div>
</div>

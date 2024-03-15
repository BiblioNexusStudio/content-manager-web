<script lang="ts">
    export let text: string;
    export let position: { top?: string; left?: string; bottom?: string; right?: string };
</script>

<div class="tooltip-container group relative flex items-center">
    <slot />

    <div
        style="top: {position.top ?? 'none'}; left: {position.left ?? 'none'}; bottom: {position.bottom ??
            'none'}; right:
        {position.right ?? 'none'};"
        class="tooltip absolute whitespace-nowrap text-sm font-bold opacity-0 transition group-hover:opacity-100
        {$$props.class}"
    >
        {text}
    </div>
</div>

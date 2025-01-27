<script>
    import ArrowsLeftRight from '$lib/icons/ArrowsLeftRight.svelte';
    import Tooltip from '../Tooltip.svelte';
    import { isEditorPaneOnLeft } from '$lib/stores/resourceEditor';
</script>

<Tooltip
    position={{ right: '2rem', top: '0.25rem' }}
    class="flex border-primary align-middle text-primary"
    text="Swap Editor Panes"
>
    <button onclick={() => ($isEditorPaneOnLeft = !$isEditorPaneOnLeft)} class="btn mt-1 h-auto min-h-0 p-1">
        <ArrowsLeftRight />
    </button>
</Tooltip>

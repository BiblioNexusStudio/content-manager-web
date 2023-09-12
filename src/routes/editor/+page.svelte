<script lang="ts">
    import Tiptap from '$lib/Tiptap.svelte';

    let jsonOutput: string | undefined;
    let htmlOutput: string;
</script>

<div class="grid grid-cols-3 gap-4 mx-8 my-4 h-3/4">
    <div class="bg-gray-200 border-4 rounded-md border-black h-full overflow-hidden">
        <Tiptap bind:jsonOutput bind:htmlOutput />
    </div>
    <div class="h-full overflow-scroll mockup-code"><pre><code>{jsonOutput}</code></pre></div>
    <div class="h-full overflow-scroll mockup-code"><pre><code>{htmlOutput}</code></pre></div>
</div>

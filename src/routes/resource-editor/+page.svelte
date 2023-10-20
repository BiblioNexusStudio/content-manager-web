<script lang="ts">
    import Tiptap from '$lib/Tiptap.svelte';

    let jsonOutput: string | undefined;
    let htmlOutput: string | undefined;
</script>

<div class="mx-8 my-4 grid h-3/4 grid-cols-3 gap-4">
    <div class="h-full overflow-hidden rounded-md border-4 border-black bg-gray-200">
        <Tiptap bind:jsonOutput bind:htmlOutput htmlDefault={{ type: 'document', content: [] }} />
    </div>
    <div class="mockup-code h-full overflow-scroll"><pre><code>{jsonOutput}</code></pre></div>
    <div class="mockup-code h-full overflow-scroll"><pre><code>{htmlOutput}</code></pre></div>
</div>

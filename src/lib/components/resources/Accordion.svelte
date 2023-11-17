<script>
    export let title = '';
    export let closable = false;
    export let fullHeight = false;
    console.log(closable);
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<details tabindex="0" class="collapse collapse-arrow mb-4 border border-base-300 bg-base-200" open>
    <summary class="collapse-title !rounded-b-none text-xl font-medium">{title}</summary>
    <div class="collapse-content overflow-y-scroll {fullHeight ? 'max-h-[75vh]' : 'max-h-32 !py-2'} bg-white">
        <slot />
    </div>
</details>

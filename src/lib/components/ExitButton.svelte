<script lang="ts">
    import { goto } from '$app/navigation';

    export let defaultPathIfNoHistory: string;

    function goBack() {
        window.history.length > 1 ? window.history.back() : goto(defaultPathIfNoHistory);
    }
</script>

<button class="btn btn-outline btn-primary border-2 font-extrabold" on:click={goBack}>Exit</button>

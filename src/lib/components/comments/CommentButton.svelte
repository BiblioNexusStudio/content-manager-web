<script lang="ts">
    export let disabled = false;
</script>

<button class="btn btn-link no-animation !bg-white text-primary !no-underline" class:btn-disabled={disabled} on:click
    ><slot /></button
>

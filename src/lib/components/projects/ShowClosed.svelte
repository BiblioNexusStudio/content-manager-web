<script lang="ts">
    export let showClosed = false;
</script>

<div class="flex items-center">
    <label for="show-closed" class="text-md">Show Closed</label>
    <input
        data-app-insights-event-name="projects-show-closed-click"
        type="checkbox"
        id="show-closed"
        bind:checked={showClosed}
        class="ms-4"
    />
</div>

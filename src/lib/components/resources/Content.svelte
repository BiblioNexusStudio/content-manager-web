<script lang="ts">
    import Accordion from './Accordion.svelte';
    const helloworld = 'Hello World!';
</script>

<Accordion title="Content" closable={false}>
    <div>
        {helloworld}
    </div>
</Accordion>

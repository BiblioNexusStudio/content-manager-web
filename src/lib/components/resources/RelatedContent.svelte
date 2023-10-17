<script lang="ts">
    import Accordion from './Accordion.svelte';
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import fileImageO from 'svelte-awesome/icons/fileImageO';

    export const resources = [
        {
            type: 'Media (Image)',
            title: 'Fisherman at Work',
            embededInText: true,
        },
        {
            type: 'Tyndale Bible Dictionary',
            title: 'Prophet',
            embededInText: false,
        },
    ];
</script>

<Accordion title="Related Content" closable={true}>
    <div class="flex flex-col">
        {#each resources as resource}
            <div class="mb-6 flex">
                <div class="flex items-center">
                    <Icon data={resource.type === 'Media (Image)' ? fileImageO : fileTextO} scale={3} />
                </div>
                <div class="ml-4 flex flex-col">
                    <span class="font-bold">{resource.title}</span>
                    <span>{resource.type}</span>
                    <span>{resource.embededInText ? 'Embedded in Text' : ''}</span>
                </div>
            </div>
        {/each}
    </div>
</Accordion>

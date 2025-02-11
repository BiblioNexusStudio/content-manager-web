<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import PlayMediaSpeedIcon from './icons/PlayMediaSpeedIcon.svelte';
    import chevronDown from 'svelte-awesome/icons/chevronDown';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import { AudioPlaylist, getAudioPlaylistContext } from './context.svelte';

    let playlist: AudioPlaylist = getAudioPlaylistContext();

    const playbackRates = [
        { value: 2, label: '2x' },
        { value: 1.75, label: '1.75' },
        { value: 1.5, label: '1.5' },
        { value: 1.25, label: '1.25' },
        { value: 1, label: 'Normal' },
        { value: 0.75, label: '0.75' },
        { value: 0.5, label: '0.5' },
    ];

    let playbackRate = $derived(playlist.playbackRate);
    let isOpen: boolean = $state(false);

    function selectPlaybackRate(rate: number) {
        playlist.setPlaybackRate(rate);
        isOpen = false;
    }
</script>

<details data-popover="right" bind:open={isOpen}>
    <summary class="relative">
        {#if playbackRate > 1}
            <Icon data={chevronUp} class="absolute right-0 top-0 h-2 w-2 text-primary" />
        {/if}
        <PlayMediaSpeedIcon />
        {#if playbackRate < 1}
            <Icon data={chevronDown} class="absolute bottom-0 right-0 h-2 w-2 text-primary" />
        {/if}
    </summary>
    <div class="rounded border-2 bg-white p-2 text-sm">
        {#each playbackRates as rate (rate.value)}
            <button
                class="px-2 py-1 hover:bg-gray-100"
                class:text-primary={playbackRate === rate.value}
                onclick={() => selectPlaybackRate(rate.value)}
                data-app-insights-event-name="audio-player-playback-speed-{rate.label}-button-clicked"
            >
                {rate.label}
            </button>
        {/each}
    </div>
</details>

<style>
    details[data-popover] {
        position: relative;
    }

    details[data-popover] > summary {
        list-style: none;
        cursor: pointer;
    }

    details[data-popover] > summary:focus {
        outline: none;
    }

    details[data-popover] > summary::-webkit-details-marker {
        display: none;
    }

    details[data-popover] > summary + * {
        position: absolute;
        display: block;
        z-index: 100;
    }

    details[data-popover='right'] > summary + * {
        left: calc(100% + 0.5rem);
        bottom: 50%;
        transform: translateY(40%);
    }

    div > button {
        width: 100%;
        text-align: right;
    }
</style>

<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import refresh from 'svelte-awesome/icons/refresh';
    import ArrowBack10Icon from './icons/ArrowBack10Icon.svelte';
    import PauseMediaIcon from './icons/PauseMediaIcon.svelte';
    import PlayMediaIcon from './icons/PlayMediaIcon.svelte';
    import ArrowForward10Icon from './icons/ArrowForward10Icon.svelte';
    import PlayMediaSpeedIcon from './icons/PlayMediaSpeedIcon.svelte';

    let { playlist } = $props();

    let duration: number = $state(0);
    let currentTime: number = $state(0);
    let paused: boolean = $state(true);
    let volume: number = $state(0.5);
    let muted: boolean = $state(false);
    let playbackRate: number = $state(1);

    let isReadyToPlay: boolean = $state(true);
    let currentTrack: number = $state(0);
    let currentTrackSrc: string = $state('');
    let rangeValue: number = $derived.by(() => {
        if (!duration) return 0;

        return 100 * (currentTime / duration);
    });

    // todo: track state for each track in playlist

    function formatTime(time: number) {
        if (isNaN(time)) return '--:--';

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);

        return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
    }

    function seek(event: Event) {
        const target = event.target as HTMLInputElement;
        currentTime = (duration * target.valueAsNumber) / 100;
    }

    function playOrPause() {
        paused = !paused;
    }

    function skipAhead() {
        let timeRemaining = duration - currentTime;
        if (timeRemaining < 10) return endOfTrack();

        currentTime += 10;
    }

    function goBack() {
        if (currentTime < 10) return beginningOfTrack();

        currentTime -= 10;
    }

    function beginningOfTrack() {
        currentTime = 0;
    }

    function endOfTrack() {
        currentTime = duration;
    }

    function selectAudioSource() {
        const audioElement = document.createElement('audio');

        for (let source of playlist[currentTrack]) {
            if (audioElement.canPlayType(`audio/${source.type}`)) {
                currentTrackSrc = source.url;
                break;
            }
        }
    }

    selectAudioSource();
</script>

<div class="audio-player items-center rounded-xl border border-base-300 bg-base-200">
    <audio
        bind:duration
        bind:currentTime
        bind:paused
        bind:volume
        bind:muted
        bind:playbackRate
        onended={() => (currentTime = 0)}
        src={currentTrackSrc}
    >
        <!-- Safari will not load track until 'play' is pressed when has multile sources -->
        <!-- {#each playlist[currentTrack] as source}
            <source src="{source.url}" type="audio/{source.type}" />
        {/each} -->
    </audio>

    <!-- progress bar -->
    <div class="grid w-full grid-cols-[2fr,1fr] items-center justify-items-center gap-4">
        <input
            type="range"
            class="range-audio range range-primary"
            step="any"
            min="0"
            max="100"
            value={rangeValue}
            oninput={seek}
            data-app-insights-event-name="audio-player-range-area-clicked"
        />
        <span class="text-sm font-medium text-neutral"
            >{formatTime(currentTime)} / {duration ? formatTime(duration) : '--:--'}
        </span>
    </div>

    <!-- controls -->
    <div class="flex items-center justify-center gap-4">
        {#if !isReadyToPlay}
            <Icon class="h-[35px] w-[35px] grow-0 text-primary" data={refresh} spin />
        {:else}
            <button
                class="audio-control-btn"
                title="Go back 10 seconds"
                aria-label="Go back 10 seconds"
                onclick={goBack}
            >
                <ArrowBack10Icon />
            </button>

            <button
                onclick={playOrPause}
                class="audio-control-btn"
                aria-label={paused ? 'play' : 'pause'}
                data-app-insights-event-name="audio-player-play-or-pause-button-clicked"
            >
                {#if !paused}
                    <PauseMediaIcon />
                {:else}
                    <PlayMediaIcon />
                {/if}
            </button>

            <button
                onclick={skipAhead}
                class="audio-control-btn"
                title="Skip ahead 10 seconds"
                aria-label="Skip ahead 10 seconds"
                data-app-insights-event-name="audio-player-play-or-pause-button-clicked"
            >
                <ArrowForward10Icon />
            </button>

            <button
                class="audio-control-btn"
                title="Adjust playback speed"
                aria-label="Adjust playback speed"
                data-app-insights-event-name="audio-player-play-or-pause-button-clicked"
            >
                <PlayMediaSpeedIcon />
            </button>
        {/if}
    </div>
</div>

<style>
    .audio-player {
        display: grid;
        padding: 1rem;
        border: 1px solid #ccc;
        width: 30rem;
        height: 10rem;
    }

    /* progress bar */
    .range-audio {
        height: 0.75rem;
    }
    .range-audio::-webkit-slider-runnable-track {
        height: 0.75rem;
    }
    .range-audio::-moz-range-track {
        height: 0.75rem;
    }
    .range-audio::-webkit-slider-thumb {
        height: 0.75rem;
        width: 0.75rem;
        --filler-offset: 0.4rem;
    }
    .range-audio::-moz-range-thumb {
        height: 0.75rem;
        width: 0.75rem;
        --filler-offset: 0.4rem;
    }

    /* controls */
    :root {
        --square-size: 2.5rem;
    }

    .audio-control-btn {
        height: var(--square-size);
        width: var(--square-size);
        cursor: pointer;
        flex-grow: 0;
    }

    .audio-control-btn:hover {
        filter: brightness(01.1);
    }
</style>

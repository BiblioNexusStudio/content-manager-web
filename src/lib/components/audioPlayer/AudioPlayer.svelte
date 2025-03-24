<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import refresh from 'svelte-awesome/icons/refresh';
    import externalLink from 'svelte-awesome/icons/externalLink';
    import ArrowBack10Icon from './icons/ArrowBack10Icon.svelte';
    import PauseMediaIcon from './icons/PauseMediaIcon.svelte';
    import PlayMediaIcon from './icons/PlayMediaIcon.svelte';
    import ArrowForward10Icon from './icons/ArrowForward10Icon.svelte';
    import {
        AudioPlaylist,
        type AudioType,
        fetchFiaAudioFromZip,
        isAudioContentItem,
        getAudioPlaylistContext,
    } from './context.svelte';
    import PlaybackSpeedPopover from './PlaybackSpeedPopover.svelte';
    import { onMount } from 'svelte';
    import type { AudioContentItem, ResourceContent } from '$lib/types/resources';
    import { Permission, userCan } from '$lib/stores/auth';

    interface AudioPlayerProps {
        audioContents: ResourceContent[] | null;
        fromAudioPlayerModal?: boolean;
    }

    let { audioContents, fromAudioPlayerModal = false }: AudioPlayerProps = $props();

    let playlist: AudioPlaylist = getAudioPlaylistContext();

    let audioElement: HTMLAudioElement | undefined = $state(undefined);
    let isReadyToPlay: boolean = $state(false);
    let duration: number = $state(0);

    let supportedAudioTypes: AudioType[] = $state.raw(checkSupportedAudioTypes());
    let deviceCannotPlayAudio = $derived(supportedAudioTypes.length === 0);
    let currentTrackSrc: string = $derived(playlist.currentTrackSrc());
    let rangeValue: number = $derived.by(() => {
        if (!duration) return 0;

        return 100 * (playlist.currentTrackTimeElapsed / duration);
    });

    function formatTime(time: number) {
        if (isNaN(time)) return '--:--';

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);

        return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
    }

    function seek(event: Event) {
        const target = event.target as HTMLInputElement;
        playlist.currentTrackTimeElapsed = (duration * target.valueAsNumber) / 100;
    }

    function playOrPause() {
        playlist.paused = !playlist.paused;
    }

    function skipAhead() {
        let timeRemaining = duration - playlist.currentTrackTimeElapsed;
        if (timeRemaining < 10) return endOfTrack();

        playlist.currentTrackTimeElapsed += 10;
    }

    function goBack() {
        if (playlist.currentTrackTimeElapsed < 10) return beginningOfTrack();

        playlist.currentTrackTimeElapsed -= 10;
    }

    function beginningOfTrack() {
        playlist.currentTrackTimeElapsed = 0;
    }

    function endOfTrack() {
        playlist.currentTrackTimeElapsed = duration;
    }

    function setPlaybackRate() {
        if (playlist.playbackRate !== audioElement?.playbackRate) {
            audioElement!.playbackRate = playlist.playbackRate;
        }
    }

    async function handlePlayerError(errorEvent: Event) {
        const target = errorEvent?.target as HTMLAudioElement;

        if (!target?.error) return;
        if (target.error.message === 'MEDIA_ELEMENT_ERROR: Empty src attribute') {
            return;
        }

        if (target?.error?.code > 2) {
            // This means that the device does not support the attempted media type.
            // Remove the first element from the supportedAudioTypes array
            // and try to play the next supported audio type.
            supportedAudioTypes = supportedAudioTypes.slice(1);
            selectAudioType();
            await populatePlaylist();
        }
    }

    function checkSupportedAudioTypes() {
        const supportedTypes: AudioType[] = [];
        const audioElement = document.createElement('audio');

        if (audioElement.canPlayType(`audio/webm`) !== '') {
            supportedTypes.push('webm');
        }

        if (audioElement.canPlayType(`audio/mpeg`) !== '') {
            supportedTypes.push('mp3');
        }

        return supportedTypes;
    }

    function selectAudioType() {
        if (!supportedAudioTypes.length) return;
        playlist.currentAudioType = supportedAudioTypes[0] || 'webm';
    }

    async function populatePlaylist() {
        if (!audioContents || supportedAudioTypes.length === 0) return;

        if (!isAudioContentItem(audioContents[0]!.content)) return;

        const audioHasSteps = !!audioContents[0]!.content.mp3?.steps?.length;

        if (audioHasSteps) {
            playlist.tracks = await fetchFiaAudioFromZip(audioContents, playlist.currentAudioType);
        } else {
            playlist.tracks = audioContents?.map((audioContent) => {
                const content = audioContent.content as AudioContentItem;

                return {
                    url: content[playlist.currentAudioType].url,
                    currentTime: 0,
                };
            });
        }
    }

    function goToAudioResourcePage() {
        const resourceContentId = audioContents && audioContents[0]?.resourceContentId;
        window.location.href = `/resources/${resourceContentId}`;
    }

    onMount(() => {
        selectAudioType();
    });

    $effect(() => {
        (async () => {
            if (!audioContents) return;
            if (audioContents.length > 0) {
                await populatePlaylist();
            }
        })();
    });

    $effect(() => {
        if (!playlist || !audioElement) return;
        if (audioElement !== playlist.element) {
            playlist.element = audioElement;
        }
    });
</script>

<div class="audio-player border-base-300 bg-base-200 items-center rounded-xl border">
    {#if deviceCannotPlayAudio}
        <div class="flex h-full w-full flex-col items-center justify-center">
            <h1 class="text-xl">Your device does not support the avaiable audio types.</h1>
        </div>
    {:else if playlist.currentTrackSrc() === ''}
        <div class="flex h-full w-full flex-col items-center justify-center">
            <h1 class="text-xl">This step does not have an audio file.</h1>
        </div>
    {:else}
        <audio
            bind:this={audioElement}
            bind:duration
            bind:currentTime={playlist.currentTrackTimeElapsed}
            bind:paused={playlist.paused}
            onloadstart={setPlaybackRate}
            onended={() => (playlist.currentTrackTimeElapsed = 0)}
            onwaiting={() => (isReadyToPlay = false)}
            oncanplaythrough={() => (isReadyToPlay = true)}
            onerror={handlePlayerError}
            src={currentTrackSrc}
        ></audio>

        <!-- progress bar -->
        <div class="grid w-full grid-cols-[2fr_1fr] items-center justify-items-center gap-4">
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
            <span class="text-neutral text-sm font-medium"
                >{formatTime(playlist.currentTrackTimeElapsed)} / {duration ? formatTime(duration) : '--:--'}
            </span>
        </div>

        <!-- controls -->
        <div class="flex items-center justify-center gap-4">
            {#if !isReadyToPlay}
                <Icon class="text-primary h-[35px] w-[35px] grow-0" data={refresh} spin />
            {:else}
                <button
                    class="audio-control-btn"
                    title="Go back 10 seconds"
                    aria-label="Go back 10 seconds"
                    data-app-insights-event-name="audio-player-go-back-10-button-clicked"
                    onclick={goBack}
                >
                    <ArrowBack10Icon />
                </button>

                <button
                    onclick={playOrPause}
                    class="audio-control-btn"
                    aria-label={playlist.paused ? 'play' : 'pause'}
                    data-app-insights-event-name="audio-player-play-or-pause-button-clicked"
                >
                    {#if !playlist.paused}
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
                    data-app-insights-event-name="audio-player-skip-ahead-10-button-clicked"
                >
                    <ArrowForward10Icon />
                </button>

                <PlaybackSpeedPopover />
                {#if $userCan(Permission.PublishContent) && fromAudioPlayerModal}
                    <button
                        onclick={goToAudioResourcePage}
                        class="audio-control-btn"
                        title="Go to audio resource page"
                        aria-label="Go to audio resource page"
                        data-app-insights-event-name="audio-player-go-to-audio-resource-button-clicked"
                    >
                        <Icon class="text-primary h-[35px] w-[35px] grow-0" data={externalLink} />
                    </button>
                {/if}
            {/if}
        </div>
    {/if}
</div>

<style>
    .audio-player {
        display: grid;
        padding: 1rem;
        border: 1px solid #ccc;
        width: 29rem;
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
        grow: 0;
    }

    .audio-control-btn:hover {
        filter: brightness(1.1);
    }
</style>

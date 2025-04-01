import type { AudioContentItem, Content } from '$lib/types/resources';
import { getContext, setContext } from 'svelte';

export type AudioTracklist = AudioTrack[];

export type AudioTrack = {
    url: string;
    currentTime: number;
};

export type AudioType = 'mp3' | 'webm';

export class AudioPlaylist {
    element: HTMLAudioElement | undefined = $state();
    paused: boolean = $state(true);
    playbackRate: number = $state(1);
    currentAudioType: AudioType = $state('webm');
    currentTrackIndex: number = $state(0);
    currentTrackTimeElapsed: number = $state(0);
    tracks: AudioTracklist | [] = $state([]);

    nextTrack() {
        if (this.hasNextTrack()) {
            this.currentTrack()!.currentTime = this.currentTrackTimeElapsed;
            this.currentTrackIndex += 1;
            this.currentTrackTimeElapsed = this.currentTrack()!.currentTime;
        }
    }

    prevTrack() {
        if (this.hasPrevTrack()) {
            this.currentTrack()!.currentTime = this.currentTrackTimeElapsed;
            this.currentTrackIndex -= 1;
            this.currentTrackTimeElapsed = this.currentTrack()!.currentTime;
        }
    }

    currentTrack(): AudioTrack | null {
        return this.tracks[this.currentTrackIndex] || null;
    }

    currentTrackSrc(): string {
        return this.currentTrack()?.url || '';
    }

    isEmpty(): boolean {
        return this.tracks.length === 0;
    }

    hasNextTrack(): boolean {
        return this.tracks.length > this.currentTrackIndex;
    }

    hasPrevTrack(): boolean {
        return this.tracks.length > 1 && this.currentTrackIndex > 0;
    }

    setPlaybackRate(rate: number) {
        this.playbackRate = rate;
        if (this.element) this.element.playbackRate = rate;
    }
}

const key = Symbol('audioPlayer');

export function createAudioPlaylistContext(): AudioPlaylist {
    setContext(key, new AudioPlaylist());
    return getAudioPlaylistContext();
}

export function setAudioPlaylistContext(playlist: AudioPlaylist) {
    setContext(key, playlist);
}

export function getAudioPlaylistContext<AudioPlaylist>() {
    return getContext(key) as AudioPlaylist;
}

export function isAudioContentItem(item: Content): item is AudioContentItem {
    return item && typeof item === 'object' && 'mp3' in item && 'webm' in item;
}
